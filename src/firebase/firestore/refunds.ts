import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type RefundData = {
  orderId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  method: 'UPI' | 'BANK_TRANSFER' | 'STORE_CREDIT';
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  transactionId?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
};

export function getAllRefundsQuery(db: Firestore) {
  return query(collection(db, 'refunds'), orderBy('createdAt', 'desc'));
}

export async function createRefund(
  db: Firestore,
  data: Omit<RefundData, 'createdAt' | 'updatedAt'>
) {
  return addDoc(collection(db, 'refunds'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRefund(
  db: Firestore,
  refundId: string,
  data: Partial<Pick<RefundData, 'status' | 'transactionId' | 'notes'>>
) {
  const ref = doc(db, 'refunds', refundId);
  return updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
