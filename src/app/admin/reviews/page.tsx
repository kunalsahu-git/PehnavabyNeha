'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, Flag, Trash2, Search, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, type WithId } from '@/firebase';
import {
  getAllReviewsQuery, updateReviewStatus, deleteReview,
  type ReviewData, type ReviewStatus,
} from '@/firebase/firestore/reviews';
import { useDataTable } from '@/hooks/useDataTable';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn("h-3 w-3 fill-current", i <= rating ? "text-amber-400" : "text-slate-200")} />
      ))}
    </div>
  );
}

const statusConfig = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  FLAGGED:  { label: 'Flagged',  cls: 'bg-red-100 text-red-700' },
};

export default function ReviewsModerationPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | ReviewStatus>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const reviewsQuery = useMemoFirebase(
    () => (db && user) ? getAllReviewsQuery(db) : null,
    [db, user]
  );
  const { data: reviews, isLoading } = useCollection<ReviewData>(reviewsQuery);

  const { searchTerm, setSearchTerm, filteredData, setFilter } = useDataTable<WithId<ReviewData>>({
    data: (reviews ?? []) as WithId<ReviewData>[],
    searchFields: ['userName', 'comment', 'productName'],
    initialSort: { key: 'createdAt', direction: 'desc' },
  });

  React.useEffect(() => {
    setFilter('status', activeTab === 'all' ? null : activeTab);
  }, [activeTab, setFilter]);

  const handleStatus = async (id: string, status: ReviewStatus) => {
    if (!db) return;
    setUpdatingId(id);
    try {
      await updateReviewStatus(db, id, status);
      toast({ title: status === 'APPROVED' ? 'Review Approved' : 'Review Flagged' });
    } catch {
      toast({ variant: 'destructive', title: 'Update failed' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !window.confirm('Delete this review permanently?')) return;
    setUpdatingId(id);
    try {
      await deleteReview(db, id);
      toast({ title: 'Review Deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Delete failed' });
    } finally {
      setUpdatingId(null);
    }
  };

  const allReviews = reviews ?? [];
  const pendingCount = allReviews.filter(r => r.status === 'PENDING').length;
  const approvedCount = allReviews.filter(r => r.status === 'APPROVED').length;
  const flaggedCount = allReviews.filter(r => r.status === 'FLAGGED').length;

  const TABS = [
    { value: 'all',      label: 'All',      count: allReviews.length },
    { value: 'PENDING',  label: 'Pending',  count: pendingCount },
    { value: 'APPROVED', label: 'Approved', count: approvedCount },
    { value: 'FLAGGED',  label: 'Flagged',  count: flaggedCount },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Review Moderation</h1>
          <p className="text-sm text-muted-foreground">Approve or flag customer reviews before they go live.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: allReviews.length, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Pending', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', urgent: pendingCount > 0 },
          { label: 'Approved', value: approvedCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Flagged', value: flaggedCount, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <Card key={stat.label} className={cn("border-none shadow-sm rounded-3xl", stat.urgent && "ring-2 ring-amber-400/40")}>
            <CardContent className="p-6">
              <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center mb-4", stat.bg)}>
                <MessageSquare className={cn("h-5 w-5", stat.color)} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-headline font-bold mt-1">{isLoading ? '—' : stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-auto">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto flex flex-wrap gap-1">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2"
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center bg-current/10">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reviewer or comment..."
            className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-50">
                  <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reviewer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rating</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Review</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? filteredData.map(review => {
                  const cfg = statusConfig[review.status as ReviewStatus] || statusConfig.PENDING;
                  const isUpdating = updatingId === review.id;
                  return (
                    <TableRow key={review.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                      <TableCell className="py-5 px-8">
                        <p className="text-sm font-bold text-slate-900">{review.userName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-slate-600 font-medium max-w-[120px] truncate">{review.productName || review.productId?.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-slate-600 max-w-[200px] line-clamp-2 leading-relaxed">{review.comment}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none", cfg.cls)}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {review.createdAt?.seconds ? format(new Date(review.createdAt.seconds * 1000), 'MMM dd, yyyy') : '—'}
                        </p>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {review.status !== 'APPROVED' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isUpdating}
                              onClick={() => handleStatus(review.id, 'APPROVED')}
                              className="h-9 w-9 rounded-full text-green-500 hover:bg-green-50"
                              title="Approve"
                            >
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            </Button>
                          )}
                          {review.status !== 'FLAGGED' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={isUpdating}
                              onClick={() => handleStatus(review.id, 'FLAGGED')}
                              className="h-9 w-9 rounded-full text-amber-500 hover:bg-amber-50"
                              title="Flag"
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isUpdating}
                            onClick={() => handleDelete(review.id)}
                            className="h-9 w-9 rounded-full text-red-400 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center text-muted-foreground text-sm">
                      No reviews found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
