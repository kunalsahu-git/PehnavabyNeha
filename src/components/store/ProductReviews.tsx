'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { getReviewsByProductIdQuery, createReview, type ReviewData } from '@/firebase/firestore/reviews';
import type { WithId } from '@/firebase/firestore/use-collection';
import { cn } from '@/lib/utils';

export function ProductReviews({ productId }: { productId: string }) {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const reviewsQuery = useMemoFirebase(() => db ? getReviewsByProductIdQuery(db, productId) : null, [db, productId]);
  const { data: rawReviews, isLoading, error } = useCollection<ReviewData>(reviewsQuery);
  const reviews = (rawReviews ?? []) as WithId<ReviewData>[];

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute aggregated stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  const countsByStar = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { countsByStar[r.rating as keyof typeof countsByStar]++; });

  const handleWriteClick = () => {
    if (!auth?.currentUser) {
      toast({ title: 'Please login', description: 'You must be logged in to write a review' });
      // Redirect to login page and encode current URL so they return
      router.push(`/account/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsWriteModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!auth?.currentUser || !db) return;
    if (rating === 0) {
      toast({ variant: 'destructive', title: 'Rating Required', description: 'Please select a star rating' });
      return;
    }
    if (!comment.trim()) {
      toast({ variant: 'destructive', title: 'Comment Required', description: 'Please write a review text' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createReview(db, {
        productId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous User',
        rating,
        comment: comment.trim(),
      });
      toast({ title: 'Review Submitted', description: 'Thank you for your feedback!' });
      setIsWriteModalOpen(false);
      setRating(0);
      setComment('');
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Submission Failed', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 border-t mt-16 md:mt-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-10 md:gap-12 items-start justify-between">
          <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
            <h2 className="text-base md:text-lg font-bold text-muted-foreground uppercase tracking-widest mb-4 md:mb-6">Customer reviews</h2>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching stats...
              </div>
            ) : totalReviews === 0 ? (
              <div className="space-y-2 mt-4">
                <p className="text-3xl font-headline font-bold text-slate-300">0.0 <span className="text-lg text-slate-200">/ 5</span></p>
                <div className="flex items-center gap-0.5 text-slate-200 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-sm text-muted-foreground font-semibold">No reviews yet.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 md:gap-4 mb-2">
                  <span className="text-5xl md:text-6xl font-headline font-bold">{averageRating}</span>
                  <span className="text-xl md:text-2xl text-muted-foreground">/ 5</span>
                </div>
                <div className="flex items-center gap-0.5 md:gap-1 text-accent mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4 md:h-5 md:w-5 fill-current", i < Math.round(Number(averageRating)) ? "text-accent" : "text-muted-foreground/30")} />
                  ))}
                  <span className="text-xs md:text-sm text-muted-foreground font-bold ml-2">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
                </div>
                <div className="w-full space-y-2 md:space-y-3 mt-4">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-[10px] md:text-xs font-bold flex items-center gap-1 min-w-[20px] md:min-w-[24px]">
                        {star} <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-accent text-accent" />
                      </span>
                      <Progress value={totalReviews > 0 ? (countsByStar[star as keyof typeof countsByStar] / totalReviews) * 100 : 0} className="h-1.5 md:h-2 flex-1" />
                      <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground w-4">{countsByStar[star as keyof typeof countsByStar]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="w-full md:w-auto mt-6 md:mt-0 flex flex-col items-center md:items-end space-y-3">
            <Button onClick={handleWriteClick} className="w-full md:w-auto bg-slate-800 text-white rounded-xl px-10 h-12 hover:bg-slate-900 transition-colors text-xs font-bold tracking-widest uppercase">
              Write a review
            </Button>
            {!auth?.currentUser && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Login required</p>}
          </div>
        </div>

        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 no-scrollbar">
          {error ? (
            <div className="col-span-1 md:col-span-full py-12 text-center border-red-200 bg-red-50 text-red-600 rounded-3xl">
              <h3 className="font-bold">Error loading reviews</h3>
              <p className="text-xs">{error.message}</p>
            </div>
          ) : isLoading ? (
            <div className="col-span-1 md:col-span-full h-32 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="col-span-1 md:col-span-full py-12 md:py-24 text-center border border-dashed rounded-3xl bg-slate-50/50">
              <Star className="h-10 w-10 text-slate-200 mx-auto mb-4" />
              <h3 className="font-headline font-bold text-slate-400 text-lg">Be the first to review this product</h3>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 md:gap-4 min-w-[280px] md:min-w-0 transition-hover hover:border-accent/40">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5 md:h-4 md:w-4 fill-current", i < review.rating ? "text-accent" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">
             {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just now'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold flex items-center gap-2">{review.userName || 'Anonymous'} <span className="bg-green-100 text-green-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full ring-1 ring-green-200">Verified</span></h4>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed mt-3 break-words whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={isWriteModalOpen} onOpenChange={setIsWriteModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Write a Review</DialogTitle>
            <DialogDescription className="text-sm">
              Share your thoughts and experience with other customers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-3 flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Overall Rating</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star className={cn("h-8 w-8 fill-current transition-colors",
                      (hoverRating || rating) >= star ? "text-accent" : "text-slate-200"
                    )} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Review</span>
              <Textarea 
                placeholder="What did you like or dislike? How's the fit and fabric?"
                className="min-h-[120px] rounded-2xl resize-none bg-slate-50/50"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto rounded-xl h-11" onClick={() => setIsWriteModalOpen(false)}>Cancel</Button>
            <Button className="w-full sm:w-auto rounded-xl h-11 font-bold tracking-widest uppercase text-[10px]" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
