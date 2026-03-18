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
  sku?: string;
  name: string;
  category: string;
  categorySlug: string;
  /** Array of collection slugs this product belongs to (for multi-collection membership) */
  collections?: string[];
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

/** Products by category slug — filter published + sort client-side (avoids composite index) */
export function getProductsByCategoryQuery(db: Firestore, categorySlug: string) {
  return query(
    collection(db, 'products'),
    where('categorySlug', '==', categorySlug)
  );
}

/** New arrivals — filter published + sort client-side (avoids composite index) */
export function getNewArrivalsQuery(db: Firestore) {
  return query(
    collection(db, 'products'),
    where('isNew', '==', true)
  );
}

/** Sale products — filter published + sort client-side (avoids composite index) */
export function getSaleProductsQuery(db: Firestore) {
  return query(
    collection(db, 'products'),
    where('isSale', '==', true)
  );
}

/** Products in a collection — filter published + sort client-side (avoids composite index) */
export function getProductsByCollectionQuery(db: Firestore, collectionSlug: string) {
  return query(
    collection(db, 'products'),
    where('collections', 'array-contains', collectionSlug)
  );
}

/** Single product by slug — filter published client-side (avoids composite index) */
export function getProductBySlugQuery(db: Firestore, slug: string) {
  return query(
    collection(db, 'products'),
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

/**
 * Generate a unique SKU for a product.
 * Format: PNH-<5-char name prefix>-<4-char random hex>
 * Example: PNH-IVORY-4F2A
 */
export function generateSku(name: string): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 5)
    .padEnd(5, 'X');
  const suffix = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `PNH-${prefix}-${suffix}`;
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
