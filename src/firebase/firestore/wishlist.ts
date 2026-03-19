import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

/** Get user wishlist by UID */
export async function getUserWishlist(db: Firestore, uid: string) {
  const wishlistRef = doc(db, 'wishlists', uid);
  const wishlistDoc = await getDoc(wishlistRef);
  
  if (!wishlistDoc.exists()) {
    return [];
  }
  
  return (wishlistDoc.data()?.productIds || []) as string[];
}

/** Toggle item in wishlist */
export async function toggleWishlistItem(db: Firestore, uid: string, productId: string, isAdded: boolean) {
  const wishlistRef = doc(db, 'wishlists', uid);
  
  return setDoc(wishlistRef, {
    productIds: isAdded ? arrayUnion(productId) : arrayRemove(productId),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Sync entire local wishlist to Firestore (for login/merge) */
export async function syncWishlist(db: Firestore, uid: string, productIds: string[]) {
  const wishlistRef = doc(db, 'wishlists', uid);
  
  return setDoc(wishlistRef, {
    productIds: arrayUnion(...productIds),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
