import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'FLAGGED';

export type ReviewData = {
  productId: string;
  productName?: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  status: ReviewStatus;
  createdAt: any;
};

// Storefront: reviews for a product — filter APPROVED + sort client-side (avoids composite index)
export function getReviewsByProductIdQuery(db: Firestore, productId: string) {
  return query(collection(db, 'reviews'), where('productId', '==', productId));
}

// Keep old name as alias so existing imports don't break
export const getApprovedReviewsByProductIdQuery = getReviewsByProductIdQuery;

// Admin: all reviews — sort client-side (avoids single-field descending index requirement)
export function getAllReviewsQuery(db: Firestore) {
  return collection(db, 'reviews');
}

// Create new review (default PENDING)
export async function createReview(
  db: Firestore,
  data: Omit<ReviewData, 'createdAt' | 'status'>
) {
  return addDoc(collection(db, 'reviews'), {
    ...data,
    status: 'PENDING' as ReviewStatus,
    createdAt: serverTimestamp(),
  });
}

// Admin: update review status
export async function updateReviewStatus(db: Firestore, reviewId: string, status: ReviewStatus) {
  return updateDoc(doc(db, 'reviews', reviewId), { status });
}

// Admin: delete review
export async function deleteReview(db: Firestore, reviewId: string) {
  return deleteDoc(doc(db, 'reviews', reviewId));
}
