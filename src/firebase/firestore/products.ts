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

export type ProductData = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  description?: string;
  details?: string[];
  isNew?: boolean;
  isSale?: boolean;
  isBestseller?: boolean;
  colors?: string[];
  sizes?: string[];
  fabric?: string;
  stock?: number;
  published: boolean;
  createdAt?: any;
  updatedAt?: any;
};

// ── Queries ───────────────────────────────────────────────────────────────────

/** All products (admin use – requires isAdmin() Firestore rule) */
export function getAllProductsQuery(db: Firestore) {
  return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
}

/** Published products by category slug (public storefront) */
export function getProductsByCategoryQuery(db: Firestore, categorySlug: string) {
  return query(
    collection(db, 'products'),
    where('published', '==', true),
    where('categorySlug', '==', categorySlug),
    orderBy('createdAt', 'desc')
  );
}

/** Published new arrivals (public storefront) */
export function getNewArrivalsQuery(db: Firestore) {
  return query(
    collection(db, 'products'),
    where('published', '==', true),
    where('isNew', '==', true),
    orderBy('createdAt', 'desc')
  );
}

/** Published sale products (public storefront) */
export function getSaleProductsQuery(db: Firestore) {
  return query(
    collection(db, 'products'),
    where('published', '==', true),
    where('isSale', '==', true),
    orderBy('createdAt', 'desc')
  );
}

/** Single product by slug (public storefront) */
export function getProductBySlugQuery(db: Firestore, slug: string) {
  return query(
    collection(db, 'products'),
    where('published', '==', true),
    where('slug', '==', slug)
  );
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createProduct(db: Firestore, data: Omit<ProductData, 'createdAt' | 'updatedAt'>) {
  return addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateProduct(db: Firestore, id: string, data: Partial<Omit<ProductData, 'createdAt'>>) {
  return updateDoc(doc(db, 'products', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(db: Firestore, id: string) {
  return deleteDoc(doc(db, 'products', id));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatProductDate(createdAt: any): string {
  if (!createdAt) return '';
  if (typeof createdAt === 'string') return new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (createdAt?.toDate) return createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return '';
}

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'Ethnic Sets': 'ethnic-wear',
  'Sarees': 'sarees',
  'Western & Fusion': 'western-fusion',
  'Accessories': 'accessories',
};

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];
