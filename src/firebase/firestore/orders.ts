import {
  collection,
  collectionGroup,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type OrderData = {
  userId: string;
  name: string;
  phone: string;
  addressJson: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentStatus: 'PENDING' | 'CONFIRMED' | 'VERIFICATION_PENDING' | 'REFUNDED';
  orderStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentScreenshotUrl?: string;
  courierName?: string;
  trackingNumber?: string;
  createdAt: any;
  updatedAt: any;
  items?: any[]; // Fallback for cases where subcollection is missing
};

export type OrderItemData = {
  productId: string;
  productName: string;
  productImage: string;
  slug: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  size?: string;
  color?: string;
};

/** List all orders across all users (Admin collectionGroup) */
export function getAllOrdersQuery(db: Firestore) {
  return query(collectionGroup(db, 'orders'), orderBy('createdAt', 'desc'));
}

/** List orders for a specific user */
export function getUserOrdersQuery(db: Firestore, userId: string) {
  return query(collection(db, 'users', userId, 'orders'), orderBy('createdAt', 'desc'));
}

/** Items subcollection for a single order */
export function getOrderItemsQuery(db: Firestore, userId: string, orderId: string) {
  return collection(db, 'users', userId, 'orders', orderId, 'items');
}

/** Update order status */
export async function updateOrderStatus(
  db: Firestore, 
  userId: string, 
  orderId: string, 
  status: OrderData['orderStatus']
) {
  const orderRef = doc(db, 'users', userId, 'orders', orderId);
  return updateDoc(orderRef, {
    orderStatus: status,
    updatedAt: serverTimestamp(),
  });
}

/** Save courier + tracking when marking shipped */
export async function updateOrderTracking(
  db: Firestore,
  userId: string,
  orderId: string,
  courierName: string,
  trackingNumber: string,
) {
  const orderRef = doc(db, 'users', userId, 'orders', orderId);
  return updateDoc(orderRef, {
    orderStatus: 'SHIPPED',
    courierName,
    trackingNumber,
    updatedAt: serverTimestamp(),
  });
}

/** Verify payment */
export async function verifyOrderPayment(
  db: Firestore, 
  userId: string, 
  orderId: string
) {
  const orderRef = doc(db, 'users', userId, 'orders', orderId);
  return updateDoc(orderRef, {
    paymentStatus: 'CONFIRMED',
    updatedAt: serverTimestamp(),
  });
}
