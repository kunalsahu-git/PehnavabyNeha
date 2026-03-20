'use client';

import React, { useState } from 'react';
import {
  IndianRupee, CreditCard, CheckCircle2, XCircle, Plus,
  Loader2, Search, AlertCircle,
} from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  useFirestore, useCollection, useMemoFirebase, useUser, type WithId,
} from '@/firebase';
import {
  getAllRefundsQuery, createRefund, updateRefund,
  type RefundData,
} from '@/firebase/firestore/refunds';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: any) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_BADGE: Record<RefundData['status'], string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  PROCESSED: 'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-700',
};

const METHOD_BADGE: Record<RefundData['method'], string> = {
  UPI:          'bg-blue-100 text-blue-700',
  BANK_TRANSFER:'bg-purple-100 text-purple-700',
  STORE_CREDIT: 'bg-green-100 text-green-700',
};

const METHOD_LABEL: Record<RefundData['method'], string> = {
  UPI:          'UPI',
  BANK_TRANSFER:'Bank Transfer',
  STORE_CREDIT: 'Store Credit',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, colorClass, prefix,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  prefix?: string;
}) {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white p-6 flex items-center gap-5">
      <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center shrink-0', colorClass)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-headline font-bold text-slate-900 leading-tight mt-0.5">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </Card>
  );
}

// ── Default form state ────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  orderId:       '',
  userId:        '',
  customerName:  '',
  customerPhone: '',
  amount:        '',
  reason:        '',
  method:        'UPI' as RefundData['method'],
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function RefundsAdminPage() {
  const db        = useFirestore();
  const { user }  = useUser();
  const { toast } = useToast();

  // Add Refund modal
  const [isAddOpen,      setIsAddOpen]      = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [formData,       setFormData]       = useState(DEFAULT_FORM);

  // Process Refund modal
  const [processingRefund, setProcessingRefund] = useState<WithId<RefundData> | null>(null);
  const [transactionId,    setTransactionId]    = useState('');
  const [processNotes,     setProcessNotes]     = useState('');
  const [isProcessing,     setIsProcessing]     = useState(false);

  // ── Firestore ──────────────────────────────────────────────────────────
  const refundsQuery = useMemoFirebase(
    () => (db && user ? getAllRefundsQuery(db) : null),
    [db, user],
  );
  const { data: refunds, isLoading } = useCollection<RefundData>(refundsQuery);

  // ── DataTable ──────────────────────────────────────────────────────────
  const { searchTerm, setSearchTerm, filteredData } = useDataTable<WithId<RefundData>>({
    data: refunds ?? [],
    searchFields: ['id', 'customerName', 'orderId', 'transactionId'],
    initialSort: { key: 'createdAt', direction: 'desc' },
  });

  // ── KPIs ───────────────────────────────────────────────────────────────
  const totalRefunded = (refunds ?? [])
    .filter(r => r.status === 'PROCESSED')
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingCount   = (refunds ?? []).filter(r => r.status === 'PENDING').length;
  const processedCount = (refunds ?? []).filter(r => r.status === 'PROCESSED').length;
  const failedCount    = (refunds ?? []).filter(r => r.status === 'FAILED').length;

  // ── Add Refund ──────────────────────────────────────────────────────────
  const handleAddRefund = async () => {
    if (!db) return;
    if (!formData.orderId || !formData.customerName || !formData.amount || !formData.reason) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill all required fields.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await createRefund(db, {
        orderId:       formData.orderId.trim(),
        userId:        formData.userId.trim(),
        customerName:  formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        amount:        Number(formData.amount),
        reason:        formData.reason.trim(),
        method:        formData.method,
        status:        'PENDING',
      });
      toast({ title: 'Refund Created', description: `Refund of ₹${Number(formData.amount).toLocaleString()} added.` });
      setIsAddOpen(false);
      setFormData(DEFAULT_FORM);
    } catch {
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not create refund. Try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Process Refund ──────────────────────────────────────────────────────
  const openProcess = (refund: WithId<RefundData>) => {
    setProcessingRefund(refund);
    setTransactionId('');
    setProcessNotes('');
  };

  const handleProcessRefund = async (status: 'PROCESSED' | 'FAILED') => {
    if (!db || !processingRefund) return;
    setIsProcessing(true);
    try {
      await updateRefund(db, processingRefund.id, {
        status,
        transactionId: transactionId.trim() || undefined,
        notes:         processNotes.trim() || undefined,
      });
      toast({
        title: status === 'PROCESSED' ? 'Refund Processed' : 'Refund Failed',
        description: `Refund ${processingRefund.id.slice(0, 8)} marked as ${status}.`,
      });
      setProcessingRefund(null);
    } catch {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">
            Refund Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Track all refunds issued for cancellations and returns
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Refund
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Refunded"
          value={totalRefunded}
          icon={IndianRupee}
          colorClass="bg-primary"
          prefix="₹"
        />
        <KpiCard label="Pending"   value={pendingCount}   icon={AlertCircle}  colorClass="bg-amber-500" />
        <KpiCard label="Processed" value={processedCount} icon={CheckCircle2} colorClass="bg-green-500" />
        <KpiCard label="Failed"    value={failedCount}    icon={XCircle}      colorClass="bg-red-500" />
      </div>

      {/* Search */}
      <div className="relative w-full lg:w-80">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ID, customer, order..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
        />
      </div>

      {/* Table */}
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
                  <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Refund ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Method</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? filteredData.map(refund => (
                  <TableRow key={refund.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                    <TableCell className="py-5 px-8">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors font-mono">
                        {refund.id.slice(0, 8)}…
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-[140px]">
                        <span className="text-sm font-medium text-slate-900">{refund.customerName}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{refund.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-slate-600">{refund.orderId.slice(0, 10)}…</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                        <IndianRupee className="h-3 w-3 text-slate-400" />
                        {refund.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none',
                        METHOD_BADGE[refund.method],
                      )}>
                        <CreditCard className="h-2 w-2 mr-1 inline" />
                        {METHOD_LABEL[refund.method]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none',
                        STATUS_BADGE[refund.status],
                      )}>
                        {refund.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{formatDate(refund.createdAt)}</span>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      {refund.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => openProcess(refund)}
                          className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-9 px-4 bg-primary hover:bg-primary/90"
                        >
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center text-muted-foreground text-sm">
                      No refunds found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* ── Add Refund Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={open => { setIsAddOpen(open); if (!open) setFormData(DEFAULT_FORM); }}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase tracking-wider text-xl">Add Refund</DialogTitle>
            <DialogDescription className="text-xs">
              Manually create a refund record for a customer order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order ID *</Label>
                <Input
                  placeholder="Order reference"
                  value={formData.orderId}
                  onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="h-11 rounded-xl border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Name *</Label>
                <Input
                  placeholder="Full name"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Phone</Label>
                <Input
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.customerPhone}
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Refund Method *</Label>
              <Select
                value={formData.method}
                onValueChange={v => setFormData({ ...formData, method: v as RefundData['method'] })}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason *</Label>
              <Textarea
                placeholder="Why is this refund being issued?"
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className="rounded-xl border-slate-200 resize-none h-20 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleAddRefund}
              className="rounded-xl h-11 px-8 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              {isSubmitting
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <Plus className="h-4 w-4 mr-2" />
              }
              Create Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Process Refund Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!processingRefund}
        onOpenChange={open => { if (!open) setProcessingRefund(null); }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase tracking-wider">Process Refund</DialogTitle>
            <DialogDescription className="text-xs">
              Refund {processingRefund?.id.slice(0, 8)}… · ₹{processingRefund?.amount.toLocaleString()} via {processingRefund ? METHOD_LABEL[processingRefund.method] : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Amount display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Refund Amount</p>
                <p className="text-2xl font-headline font-bold text-primary">₹{processingRefund?.amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transaction ID</Label>
              <Input
                placeholder="e.g. UPI123456 / NEFT Ref"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                className="h-11 rounded-xl border-slate-200 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Notes</Label>
              <Textarea
                placeholder="Any notes about this transaction..."
                value={processNotes}
                onChange={e => setProcessNotes(e.target.value)}
                className="rounded-xl border-slate-200 resize-none h-20 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => handleProcessRefund('FAILED')}
              className="rounded-xl h-11 px-5 font-bold uppercase text-[10px] tracking-widest text-red-600 border-red-200 hover:bg-red-50 gap-2"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Mark Failed
            </Button>
            <Button
              disabled={isProcessing}
              onClick={() => handleProcessRefund('PROCESSED')}
              className="rounded-xl h-11 px-6 font-bold uppercase text-[10px] tracking-widest bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg shadow-green-200"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark Processed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
