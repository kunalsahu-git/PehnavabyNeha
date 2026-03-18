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

export type CategoryData = {
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  published: boolean;
  createdAt: any;
  updatedAt: any;
};

export function getAllCategoriesQuery(db: Firestore) {
  return query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
}

export async function createCategory(
  db: Firestore,
  data: Omit<CategoryData, 'createdAt' | 'updatedAt'>
) {
  return addDoc(collection(db, 'categories'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCategory(
  db: Firestore,
  id: string,
  data: Partial<Omit<CategoryData, 'createdAt' | 'updatedAt'>>
) {
  return updateDoc(doc(db, 'categories', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(db: Firestore, id: string) {
  return deleteDoc(doc(db, 'categories', id));
}
