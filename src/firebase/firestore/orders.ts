import {
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
};

/** List all orders across all users (Admin) */
export function getAllOrdersQuery(db: Firestore) {
  return query(collectionGroup(db, 'orders'), orderBy('createdAt', 'desc'));
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
