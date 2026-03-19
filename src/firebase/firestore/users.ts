import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  birthMonth?: string;
  birthYear?: string;
  role?: 'USER' | 'ADMIN';
  createdAt: any;
  updatedAt: any;
};

export type UserAddress = {
  id: string;
  label: string; // Home, Work, etc.
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
};

/** Get user profile by UID */
export async function getUserProfile(db: Firestore, uid: string) {
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return { ...userDoc.data(), uid: userDoc.id } as UserProfile;
}

/** Update user profile */
export async function updateUserProfile(db: Firestore, uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  
  return setDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Get user addresses query */
export function getUserAddressesQuery(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'addresses');
}

/** Save or update a user address */
export async function saveUserAddress(db: Firestore, uid: string, address: Omit<UserAddress, 'id'> & { id?: string }) {
  const isNew = !address.id;
  const addressRef = isNew 
    ? doc(collection(db, 'users', uid, 'addresses'))
    : doc(db, 'users', uid, 'addresses', address.id!);
  
  const data = {
    ...address,
    id: addressRef.id,
    updatedAt: serverTimestamp(),
  };

  return setDoc(addressRef, data, { merge: true });
}

/** Delete a user address */
export async function deleteUserAddress(db: Firestore, uid: string, addressId: string) {
  const addressRef = doc(db, 'users', uid, 'addresses', addressId);
  return deleteDoc(addressRef);
}
