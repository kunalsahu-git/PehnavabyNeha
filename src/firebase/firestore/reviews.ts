import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type ReviewData = {
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: any;
};

// Get reviews for a specific product
export function getReviewsByProductIdQuery(db: Firestore, productId: string) {
  return query(
    collection(db, 'reviews'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  );
}

// Create a new review
export async function createReview(
  db: Firestore,
  data: Omit<ReviewData, 'createdAt'>
) {
  return addDoc(collection(db, 'reviews'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

// Admin delete review (optional for future moderation)
export async function deleteReview(db: Firestore, reviewId: string) {
  return deleteDoc(doc(db, 'reviews', reviewId));
}
