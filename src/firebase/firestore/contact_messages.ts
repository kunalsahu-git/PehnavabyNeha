import {
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  type Firestore,
} from 'firebase/firestore';

export type ContactMessageStatus = 'unread' | 'read' | 'replied';

export type ContactMessageData = {
  name: string;
  email: string;
  phone?: string;
  inquiryType: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: any;
};

export function getAllContactMessagesQuery(db: Firestore) {
  return query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
}

export async function createContactMessage(
  db: Firestore,
  data: Omit<ContactMessageData, 'status' | 'createdAt'>
) {
  return addDoc(collection(db, 'contact_messages'), {
    ...data,
    status: 'unread' as ContactMessageStatus,
    createdAt: serverTimestamp(),
  });
}

export async function markMessageRead(db: Firestore, messageId: string) {
  return updateDoc(doc(db, 'contact_messages', messageId), { status: 'read' });
}

export async function markMessageReplied(db: Firestore, messageId: string) {
  return updateDoc(doc(db, 'contact_messages', messageId), { status: 'replied' });
}
