import {
  doc,
  getDoc,
  setDoc,
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

const SETTINGS_DOC_PATH = 'configs/settings';

export async function getBoutiqueSettings(db: Firestore): Promise<BoutiqueSettings | null> {
  const docRef = doc(db, SETTINGS_DOC_PATH, 'general');
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() as BoutiqueSettings : null;
}

export async function saveBoutiqueSettings(db: Firestore, settings: BoutiqueSettings) {
  const docRef = doc(db, SETTINGS_DOC_PATH, 'general');
  return setDoc(docRef, settings, { merge: true });
}
