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

export type HeroSlideData = {
  title: string;
  description: string;
  tag: string;
  imageUrl: string;
  href: string;
  ctaLabel: string;
  order: number;
  published: boolean;
  createdAt: any;
  updatedAt: any;
};

export function getAllHeroSlidesQuery(db: Firestore) {
  return query(collection(db, 'hero_slides'), orderBy('order', 'asc'));
}

export function getPublishedHeroSlidesQuery(db: Firestore) {
  return query(collection(db, 'hero_slides'), where('published', '==', true), orderBy('order', 'asc'));
}

export async function createHeroSlide(
  db: Firestore,
  data: Omit<HeroSlideData, 'createdAt' | 'updatedAt'>
) {
  return addDoc(collection(db, 'hero_slides'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateHeroSlide(
  db: Firestore,
  id: string,
  data: Partial<Omit<HeroSlideData, 'createdAt' | 'updatedAt'>>
) {
  return updateDoc(doc(db, 'hero_slides', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteHeroSlide(db: Firestore, id: string) {
  return deleteDoc(doc(db, 'hero_slides', id));
}

export async function reorderHeroSlide(db: Firestore, id: string, order: number) {
  return updateDoc(doc(db, 'hero_slides', id), { order, updatedAt: serverTimestamp() });
}
