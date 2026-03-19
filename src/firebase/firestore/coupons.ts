import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
  Timestamp,
} from 'firebase/firestore';

export type RewardType = 'PERCENTAGE' | 'FIXED';

export type CouponData = {
  code: string; // Uppercase, e.g., "WELCOME10"
  description: string;
  rewardType: RewardType;
  rewardValue: number;
  
  // Conditions
  minOrderValue?: number;
  minQuantity?: number;
  excludeSaleItems?: boolean;
  
  // Restrictions
  applicableCategoryIds?: string[];
  applicableCollectionIds?: string[];
  applicableProductIds?: string[];
  
  // Usage & Limits
  totalLimit?: number;
  perUserLimit?: number;
  usageCount: number;
  
  // Timing
  startDate?: any;
  endDate?: any;
  
  // Status
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
};

export function getCouponsQuery(db: Firestore) {
  return query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
}

export async function createCoupon(db: Firestore, data: Omit<CouponData, 'createdAt' | 'updatedAt' | 'usageCount'>) {
  return addDoc(collection(db, 'coupons'), {
    ...data,
    code: data.code.toUpperCase().trim(),
    usageCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCoupon(db: Firestore, id: string, data: Partial<CouponData>) {
  const ref = doc(db, 'coupons', id);
  return updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCoupon(db: Firestore, id: string) {
  return deleteDoc(doc(db, 'coupons', id));
}

/**
 * Validates a coupon against a set of order criteria.
 * Returns { valid: true, discount: number } or { valid: false, reason: string }.
 */
export async function validateCoupon(
  db: Firestore,
  code: string,
  userId: string,
  cartItems: any[],
  subtotal: number
) {
  const couponsRef = collection(db, 'coupons');
  const q = query(couponsRef, where('code', '==', code.toUpperCase().trim()), where('isActive', '==', true));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    return { valid: false, reason: 'Invalid or expired coupon code.' };
  }
  
  const coupon = snap.docs[0].data() as CouponData;
  const now = new Date();
  
  // 1. Date Check
  if (coupon.startDate && coupon.startDate.toDate() > now) {
    return { valid: false, reason: 'This coupon is not yet active.' };
  }
  if (coupon.endDate && coupon.endDate.toDate() < now) {
    return { valid: false, reason: 'This coupon has expired.' };
  }
  
  // 2. Global Usage Limit
  if (coupon.totalLimit && coupon.usageCount >= coupon.totalLimit) {
    return { valid: false, reason: 'This coupon has reached its maximum usage limit.' };
  }
  
  // 3. Min Order Value
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return { valid: false, reason: `Minimum order value of ₹${coupon.minOrderValue} required.` };
  }
  
  // 4. Min Quantity
  const totalQty = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  if (coupon.minQuantity && totalQty < coupon.minQuantity) {
    return { valid: false, reason: `Minimum of ${coupon.minQuantity} items required.` };
  }
  
  // 5. Scope Checks (Categories/Collections/Products)
  // Determine which items the coupon applies to
  const applicableItems = cartItems.filter(item => {
    if (coupon.applicableProductIds?.length && !coupon.applicableProductIds.includes(item.productId)) return false;
    if (coupon.applicableCategoryIds?.length && !coupon.applicableCategoryIds.includes(item.categoryId)) return false;
    if (coupon.applicableCollectionIds?.length && !coupon.applicableCollectionIds.includes(item.collectionId)) return false;
    if (coupon.excludeSaleItems && (item.originalPrice && item.originalPrice > item.price)) return false;
    return true;
  });
  
  if (applicableItems.length === 0) {
    return { valid: false, reason: 'This coupon is not applicable to any items in your cart.' };
  }
  
  // 6. Calculate Discount
  const applicableSubtotal = applicableItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  let discount = 0;
  
  if (coupon.rewardType === 'PERCENTAGE') {
    discount = (applicableSubtotal * coupon.rewardValue) / 100;
  } else {
    discount = Math.min(coupon.rewardValue, applicableSubtotal); // Cannot discount more than the items' cost
  }
  
  // 7. Per-User Limit Check
  if (coupon.perUserLimit && userId) {
    const ordersRef = collection(db, 'users', userId, 'orders');
    const userOrdersQuery = query(ordersRef, where('couponCode', '==', coupon.code.toUpperCase()));
    const userOrdersSnap = await getDocs(userOrdersQuery);
    
    if (userOrdersSnap.size >= coupon.perUserLimit) {
      return { valid: false, reason: `You have already used this coupon ${coupon.perUserLimit} time(s).` };
    }
  }
  
  return { 
    valid: true, 
    discount, 
    couponId: snap.docs[0].id,
    couponCode: coupon.code,
    description: coupon.description 
  };
}
