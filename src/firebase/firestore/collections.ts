import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type CollectionData = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  published: boolean;
  createdAt: any;
  updatedAt: any;
};

export function getAllCollectionsQuery(db: Firestore) {
  return query(collection(db, 'collections'), orderBy('createdAt', 'desc'));
}

export async function createCollection(
  db: Firestore,
  data: Omit<CollectionData, 'createdAt' | 'updatedAt'>
) {
  return addDoc(collection(db, 'collections'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCollection(
  db: Firestore,
  id: string,
  data: Partial<Omit<CollectionData, 'createdAt' | 'updatedAt'>>
) {
  return updateDoc(doc(db, 'collections', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCollection(db: Firestore, id: string) {
  return deleteDoc(doc(db, 'collections', id));
}
