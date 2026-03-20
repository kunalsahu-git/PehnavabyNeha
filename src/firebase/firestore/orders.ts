import {
  collection,
  collectionGroup,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  increment,
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
  paymentStatus: 'PENDING' | 'VERIFICATION_PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
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
  return collectionGroup(db, 'orders');
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

/** Decrement product stock when payment is verified */
export async function decrementStockForOrder(
  db: Firestore,
  items: { productId: string; quantity: number }[]
) {
  return Promise.all(
    items.map(item =>
      updateDoc(doc(db, 'products', item.productId), {
        stock: increment(-item.quantity),
      })
    )
  );
}

/** Verify payment — confirms payment and moves order to PROCESSING */
export async function verifyOrderPayment(
  db: Firestore,
  userId: string,
  orderId: string
) {
  const orderRef = doc(db, 'users', userId, 'orders', orderId);
  return updateDoc(orderRef, {
    paymentStatus: 'CONFIRMED',
    orderStatus: 'PROCESSING',
    updatedAt: serverTimestamp(),
  });
}

/** Reject payment — marks payment as failed and cancels the order */
export async function rejectOrderPayment(
  db: Firestore,
  userId: string,
  orderId: string
) {
  const orderRef = doc(db, 'users', userId, 'orders', orderId);
  return updateDoc(orderRef, {
    paymentStatus: 'FAILED',
    orderStatus: 'CANCELLED',
    updatedAt: serverTimestamp(),
  });
}
