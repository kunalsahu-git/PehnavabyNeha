import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type StudioReelData = {
  title: string;
  tag: string;
  imageUrl: string;
  videoUrl?: string;
  instagramUrl?: string;
  order: number;
  published: boolean;
  createdAt: any;
  updatedAt: any;
};

export function getAllStudioReelsQuery(db: Firestore) {
  return query(collection(db, 'studio_reels'), orderBy('order', 'asc'));
}

export function getPublishedStudioReelsQuery(db: Firestore) {
  return query(collection(db, 'studio_reels'), where('published', '==', true), orderBy('order', 'asc'));
}

export async function createStudioReel(
  db: Firestore,
  data: Omit<StudioReelData, 'createdAt' | 'updatedAt'>
) {
  return addDoc(collection(db, 'studio_reels'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateStudioReel(
  db: Firestore,
  id: string,
  data: Partial<Omit<StudioReelData, 'createdAt' | 'updatedAt'>>
) {
  return updateDoc(doc(db, 'studio_reels', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStudioReel(db: Firestore, id: string) {
  return deleteDoc(doc(db, 'studio_reels', id));
}

export async function reorderStudioReel(db: Firestore, id: string, order: number) {
  return updateDoc(doc(db, 'studio_reels', id), { order, updatedAt: serverTimestamp() });
}
