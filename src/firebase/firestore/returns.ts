import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  where,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type ReturnItemData = {
  productId: string;
  productName: string;
  productImage?: string;
  size?: string;
  quantity: number;
  price: number;
};

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'EXCHANGE_DISPATCHED';

export type ReturnData = {
  orderId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: ReturnItemData[];
  type: 'RETURN' | 'EXCHANGE';
  reason: string;
  status: ReturnStatus;
  adminNotes?: string;
  refundAmount?: number;
  createdAt: any;
  updatedAt: any;
};

export function getAllReturnsQuery(db: Firestore) {
  return query(collection(db, 'returns'), orderBy('createdAt', 'desc'));
}

export function getUserReturnsQuery(db: Firestore, userId: string) {
  return query(
    collection(db, 'returns'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
}

export async function createReturn(
  db: Firestore,
  data: Omit<ReturnData, 'createdAt' | 'updatedAt' | 'status'>
) {
  return addDoc(collection(db, 'returns'), {
    ...data,
    status: 'REQUESTED' as ReturnStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateReturnStatus(
  db: Firestore,
  returnId: string,
  status: ReturnData['status'],
  adminNotes?: string,
  refundAmount?: number
) {
  const ref = doc(db, 'returns', returnId);
  const payload: Record<string, any> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (adminNotes !== undefined) payload.adminNotes = adminNotes;
  if (refundAmount !== undefined) payload.refundAmount = refundAmount;
  return updateDoc(ref, payload);
}
