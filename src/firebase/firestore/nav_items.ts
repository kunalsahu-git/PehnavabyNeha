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

export type NavChild = {
  label: string;
  href: string;
  description?: string;
  order: number;
};

export type NavItemData = {
  label: string;
  /** Leave empty for parent-only items that only open a dropdown */
  href?: string;
  order: number;
  published: boolean;
  /** Renders the label in primary/accent color (e.g. "Sale") */
  highlight?: boolean;
  /** Opens link in a new tab */
  openInNewTab?: boolean;
  /** Child links shown in a dropdown panel */
  children?: NavChild[];
  createdAt: any;
  updatedAt: any;
};

export function getAllNavItemsQuery(db: Firestore) {
  return query(collection(db, 'nav_items'), orderBy('order', 'asc'));
}

/** All nav items ordered — filter published client-side (avoids composite index) */
export function getPublishedNavItemsQuery(db: Firestore) {
  return query(collection(db, 'nav_items'), orderBy('order', 'asc'));
}

export async function createNavItem(
  db: Firestore,
  data: Omit<NavItemData, 'createdAt' | 'updatedAt'>
) {
  return addDoc(collection(db, 'nav_items'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateNavItem(
  db: Firestore,
  id: string,
  data: Partial<Omit<NavItemData, 'createdAt' | 'updatedAt'>>
) {
  return updateDoc(doc(db, 'nav_items', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNavItem(db: Firestore, id: string) {
  return deleteDoc(doc(db, 'nav_items', id));
}

export async function reorderNavItem(db: Firestore, id: string, order: number) {
  return updateDoc(doc(db, 'nav_items', id), { order, updatedAt: serverTimestamp() });
}
