'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RotateCcw, Package, CheckCircle2, XCircle,
  Clock, Loader2, Plus, ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { getUserOrdersQuery, getOrderItemsQuery, type OrderData, type OrderItemData } from '@/firebase/firestore/orders';
import { getUserReturnsQuery, createReturn, type ReturnData, type ReturnStatus } from '@/firebase/firestore/returns';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDocs } from 'firebase/firestore';
import type { WithId } from '@/firebase';

const RETURN_REASONS = [
  'Wrong size received',
  'Product damaged / defective',
  'Not as described',
  'Changed my mind',
  'Duplicate order',
  'Other',
];

const statusConfig: Record<ReturnStatus, { label: string; color: string; icon: React.ReactNode }> = {
  REQUESTED:           { label: 'Requested',           color: 'bg-amber-100 text-amber-700',  icon: <Clock className="h-3 w-3" /> },
  APPROVED:            { label: 'Approved',             color: 'bg-green-100 text-green-700',  icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED:            { label: 'Rejected',             color: 'bg-red-100 text-red-700',      icon: <XCircle className="h-3 w-3" /> },
  COMPLETED:           { label: 'Completed',            color: 'bg-slate-100 text-slate-700',  icon: <CheckCircle2 className="h-3 w-3" /> },
  EXCHANGE_DISPATCHED: { label: 'Exchange Dispatched',  color: 'bg-blue-100 text-blue-700',   icon: <ArrowLeftRight className="h-3 w-3" /> },
};

export default function ReturnsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<WithId<OrderData>[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [returnType, setReturnType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isFetchingItems, setIsFetchingItems] = useState(false);

  const returnsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return getUserReturnsQuery(db, user.uid);
  }, [db, user?.uid]);

  const { data: myReturns, isLoading: isReturnsLoading } = useCollection<ReturnData>(returnsQuery);

  // Fetch user's delivered orders for the dropdown
  useEffect(() => {
    async function fetchOrders() {
      if (!db || !user?.uid) return;
      const q = getUserOrdersQuery(db, user.uid);
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WithId<OrderData>));
      setOrders(docs.filter(o => o.orderStatus === 'DELIVERED'));
    }
    fetchOrders();
  }, [db, user?.uid]);

  // Fetch order items when order selected
  useEffect(() => {
    async function fetchItems() {
      if (!db || !user?.uid || !selectedOrderId) return;
      setIsFetchingItems(true);
      try {
        const q = getOrderItemsQuery(db, user.uid, selectedOrderId);
        const snap = await getDocs(q);
        setOrderItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        setIsFetchingItems(false);
      }
    }
    fetchItems();
  }, [db, user?.uid, selectedOrderId]);

  const handleSubmit = async () => {
    if (!db || !user) return;
    if (!selectedOrderId) {
      toast({ variant: 'destructive', title: 'Select an order', description: 'Please choose which order you want to return.' });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ variant: 'destructive', title: 'Select items', description: 'Please select at least one item to return.' });
      return;
    }
    const finalReason = reason === 'Other' ? customReason : reason;
    if (!finalReason.trim()) {
      toast({ variant: 'destructive', title: 'Reason required', description: 'Please provide a reason for the return.' });
      return;
    }

    const selectedOrder = orders.find(o => o.id === selectedOrderId);
    const returnItems = orderItems
      .filter(i => selectedItems.includes(i.id))
      .map(i => ({
        productId: i.productId || i.id,
        productName: i.productName || i.name,
        productImage: i.productImage || i.image || '',
        size: i.size || '',
        quantity: i.quantity,
        price: i.price,
      }));

    setIsSubmitting(true);
    try {
      await createReturn(db, {
        orderId: selectedOrderId,
        userId: user.uid,
        customerName: selectedOrder?.name || user.displayName || '',
        customerPhone: selectedOrder?.phone || '',
        items: returnItems,
        type: returnType,
        reason: finalReason,
      });
      toast({ title: 'Return Requested!', description: 'We\'ll review your request and reach out within 24-48 hours.' });
      setIsModalOpen(false);
      setSelectedOrderId('');
      setSelectedItems([]);
      setReason('');
      setCustomReason('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Submission failed', description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please log in to view your returns.</p>
        <Button asChild><Link href="/account/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="bg-secondary/10 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Link href="/account/profile" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-2 h-3 w-3" /> Back to Profile
            </Link>
            <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Returns & Exchanges</h1>
            <p className="text-muted-foreground text-sm">Request a return or exchange for any delivered order within 7 days.</p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" /> New Request
          </Button>
        </div>

        {/* Policy Note */}
        <div className="mb-8 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
          <RotateCcw className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-blue-900">Return Policy</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              We accept returns and exchanges within <strong>7 days</strong> of delivery for unused items in original condition.
              Sale items are not eligible for returns. Processing takes 3-5 business days.
            </p>
          </div>
        </div>

        {/* Returns List */}
        {isReturnsLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : !myReturns || myReturns.length === 0 ? (
          <div className="py-24 text-center space-y-6 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="h-20 w-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-headline font-bold">No return requests</h3>
              <p className="text-muted-foreground text-sm">Start a new request to return or exchange an item.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="rounded-full px-10 h-12 font-bold uppercase text-[10px] tracking-widest">
              Create Return Request
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {myReturns.map(ret => {
              const cfg = statusConfig[ret.status];
              return (
                <div key={ret.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-slate-50/50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Request ID</p>
                        <p className="text-sm font-bold font-mono">{ret.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Order</p>
                        <p className="text-sm font-mono font-medium">{ret.orderId.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date</p>
                        <p className="text-sm font-medium">
                          {ret.createdAt?.seconds ? format(new Date(ret.createdAt.seconds * 1000), 'MMM dd, yyyy') : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-tighter border-none flex items-center gap-1", cfg.color)}>
                        {cfg.icon} {cfg.label}
                      </Badge>
                      <Badge variant="outline" className={cn(
                        "rounded-full px-3 text-[9px] font-bold uppercase tracking-tighter",
                        ret.type === 'EXCHANGE' ? "border-blue-200 text-blue-700" : "border-purple-200 text-purple-700"
                      )}>
                        {ret.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm text-slate-700">{ret.reason}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Items</p>
                      <div className="flex flex-wrap gap-2">
                        {ret.items.map((item, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                            {item.productName} {item.size ? `(${item.size})` : ''} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    {ret.adminNotes && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Admin Note</p>
                        <p className="text-xs text-blue-800">{ret.adminNotes}</p>
                      </div>
                    )}
                    {ret.refundAmount && (
                      <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs font-bold text-green-700">Refund Amount: ₹{ret.refundAmount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Return Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="font-headline uppercase tracking-wider text-2xl">New Return / Exchange</DialogTitle>
              <DialogDescription className="text-xs">Select the order and items you wish to return or exchange.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Type */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Request Type</Label>
                <RadioGroup value={returnType} onValueChange={(v: any) => setReturnType(v)} className="flex gap-4">
                  {(['RETURN', 'EXCHANGE'] as const).map(type => (
                    <div key={type} className={cn(
                      "flex-1 flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all",
                      returnType === type ? "border-primary bg-primary/5" : "border-slate-100"
                    )} onClick={() => setReturnType(type)}>
                      <RadioGroupItem value={type} id={type} />
                      <div>
                        <Label htmlFor={type} className="font-bold text-sm cursor-pointer">{type === 'RETURN' ? '↩ Return' : '↔ Exchange'}</Label>
                        <p className="text-[9px] text-muted-foreground">{type === 'RETURN' ? 'Get a refund' : 'Get a different size/item'}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Order Select */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Delivered Order</Label>
                <select
                  value={selectedOrderId}
                  onChange={e => { setSelectedOrderId(e.target.value); setSelectedItems([]); }}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Choose an order...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.id.slice(0, 8).toUpperCase()} — ₹{o.total.toLocaleString()} — {o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'MMM dd') : ''}
                    </option>
                  ))}
                </select>
                {orders.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">No delivered orders found. Only delivered orders are eligible for returns.</p>
                )}
              </div>

              {/* Items */}
              {selectedOrderId && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Items to Return</Label>
                  {isFetchingItems ? (
                    <div className="flex items-center gap-2 py-4"><Loader2 className="h-4 w-4 animate-spin text-primary/40" /><span className="text-xs text-muted-foreground">Loading items...</span></div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No items found for this order.</p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItems(prev =>
                            prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                          )}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                            selectedItems.includes(item.id) ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                            selectedItems.includes(item.id) ? "border-primary bg-primary" : "border-slate-300"
                          )}>
                            {selectedItems.includes(item.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{item.productName || item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.size && `Size: ${item.size} • `}Qty: {item.quantity} • ₹{item.price?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason</Label>
                <div className="flex flex-wrap gap-2">
                  {RETURN_REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-tighter px-3 py-1.5 rounded-full border transition-all",
                        reason === r ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-primary/30"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {reason === 'Other' && (
                  <Textarea
                    placeholder="Please describe your reason..."
                    className="rounded-xl resize-none"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                  />
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-xl h-12 px-8 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
