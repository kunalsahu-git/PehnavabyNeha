import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type BoutiqueSettings = {
  displayName: string;
  supportEmail: string;
  whatsapp: string;
  instagram: string;
  address: string;
  upiId: string;
  codEnabled: boolean;
  freeDeliveryThreshold: number;
  shippingFee: number;
  deliveryMessage: string;
  announcementVisible: boolean;
  announcementMessages: string[];
  purchasePopupsEnabled: boolean;
  aiAssistantEnabled: boolean;
};

export async function getBoutiqueSettings(db: Firestore): Promise<BoutiqueSettings | null> {
  const docRef = doc(db, 'configs', 'settings');
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() as BoutiqueSettings : null;
}

export async function saveBoutiqueSettings(db: Firestore, settings: BoutiqueSettings) {
  const docRef = doc(db, 'configs', 'settings');
  return setDoc(docRef, settings, { merge: true });
}

// ── Featured Product Config ────────────────────────────────────────────────────

export type FeaturedProductConfig = {
  /** Firestore document ID of the product — stable even if slug/name changes */
  productId: string;
  /** Denormalized slug for URL routing (/products/[slug]) */
  productSlug: string;
  /** Denormalized name for display without a second Firestore read */
  productName: string;
  /** Optional marketing headline override shown on the homepage */
  headline?: string;
  updatedAt?: any;
};

export async function getFeaturedProductConfig(db: Firestore): Promise<FeaturedProductConfig | null> {
  const snap = await getDoc(doc(db, 'configs', 'featured_product'));
  return snap.exists() ? snap.data() as FeaturedProductConfig : null;
}

export async function saveFeaturedProductConfig(db: Firestore, config: Omit<FeaturedProductConfig, 'updatedAt'>) {
  return setDoc(doc(db, 'configs', 'featured_product'), {
    ...config,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
