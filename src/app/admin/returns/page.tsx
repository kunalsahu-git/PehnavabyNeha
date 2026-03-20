'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  RotateCcw, CheckCircle2, XCircle, Package, Eye,
  ArrowLeftRight, Loader2, Search,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  useFirestore, useCollection, useMemoFirebase, useUser, type WithId,
} from '@/firebase';
import {
  getAllReturnsQuery, updateReturnStatus,
  type ReturnData,
} from '@/firebase/firestore/returns';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: any) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_BADGE: Record<ReturnData['status'], string> = {
  REQUESTED:          'bg-amber-100 text-amber-700',
  APPROVED:           'bg-green-100 text-green-700',
  REJECTED:           'bg-red-100 text-red-700',
  COMPLETED:          'bg-slate-100 text-slate-700',
  EXCHANGE_DISPATCHED:'bg-blue-100 text-blue-700',
};

const STATUS_DOT: Record<ReturnData['status'], string> = {
  REQUESTED:          'bg-amber-500',
  APPROVED:           'bg-green-500',
  REJECTED:           'bg-red-500',
  COMPLETED:          'bg-slate-400',
  EXCHANGE_DISPATCHED:'bg-blue-500',
};

const TYPE_BADGE: Record<ReturnData['type'], string> = {
  RETURN:   'bg-purple-100 text-purple-700',
  EXCHANGE: 'bg-blue-100 text-blue-700',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white p-6 flex items-center gap-5">
      <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center shrink-0', colorClass)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-3xl font-headline font-bold text-slate-900 leading-tight mt-0.5">{value}</p>
      </div>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS: { value: string; label: string }[] = [
  { value: 'all',                label: 'All' },
  { value: 'REQUESTED',          label: 'Requested' },
  { value: 'APPROVED',           label: 'Approved' },
  { value: 'REJECTED',           label: 'Rejected' },
  { value: 'COMPLETED',          label: 'Completed' },
  { value: 'EXCHANGE_DISPATCHED',label: 'Exchange Dispatched' },
];

export default function ReturnsAdminPage() {
  const db          = useFirestore();
  const { user }    = useUser();
  const { toast }   = useToast();

  const [activeTab, setActiveTab]             = useState('all');
  const [selectedReturn, setSelectedReturn]   = useState<WithId<ReturnData> | null>(null);
  const [isDetailOpen, setIsDetailOpen]       = useState(false);
  const [adminNotes, setAdminNotes]           = useState('');
  const [refundAmount, setRefundAmount]       = useState('');
  const [isUpdating, setIsUpdating]           = useState(false);

  // ── Firestore ────────────────────────────────────────────────────────────
  const returnsQuery = useMemoFirebase(
    () => (db && user ? getAllReturnsQuery(db) : null),
    [db, user],
  );
  const { data: returns, isLoading } = useCollection<ReturnData>(returnsQuery);

  // ── DataTable ────────────────────────────────────────────────────────────
  const {
    searchTerm, setSearchTerm,
    filteredData,
    setFilter,
  } = useDataTable<WithId<ReturnData>>({
    data: returns ?? [],
    searchFields: ['id', 'customerName', 'customerPhone', 'orderId'],
    initialSort: { key: 'createdAt', direction: 'desc' },
  });

  // Sync active tab → filter
  React.useEffect(() => {
    setFilter('status', activeTab === 'all' ? null : activeTab);
  }, [activeTab, setFilter]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const total     = (returns ?? []).length;
  const pending   = (returns ?? []).filter(r => r.status === 'REQUESTED').length;
  const approved  = (returns ?? []).filter(r => r.status === 'APPROVED').length;
  const completed = (returns ?? []).filter(r => r.status === 'COMPLETED').length;

  // ── Actions ───────────────────────────────────────────────────────────────
  const openDetail = (r: WithId<ReturnData>) => {
    setSelectedReturn(r);
    setAdminNotes(r.adminNotes ?? '');
    setRefundAmount(r.refundAmount != null ? String(r.refundAmount) : '');
    setIsDetailOpen(true);
  };

  const handleStatusUpdate = async (status: ReturnData['status']) => {
    if (!db || !selectedReturn) return;
    setIsUpdating(true);
    try {
      await updateReturnStatus(
        db,
        selectedReturn.id,
        status,
        adminNotes || undefined,
        refundAmount ? Number(refundAmount) : undefined,
      );
      toast({ title: 'Status Updated', description: `Return ${selectedReturn.id.slice(0, 8)} → ${status}` });
      setIsDetailOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">
          Returns & Exchanges
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage customer return and exchange requests
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Requests" value={total}    icon={RotateCcw}    colorClass="bg-primary" />
        <KpiCard label="Pending"        value={pending}  icon={Package}      colorClass="bg-amber-500" />
        <KpiCard label="Approved"       value={approved} icon={CheckCircle2} colorClass="bg-green-500" />
        <KpiCard label="Completed"      value={completed}icon={CheckCircle2} colorClass="bg-slate-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto flex flex-wrap gap-1">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ID, customer, order..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
          />
        </div>
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
                  <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Return ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Items</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? filteredData.map(ret => (
                  <TableRow
                    key={ret.id}
                    className="hover:bg-slate-50/50 border-slate-50 transition-colors group cursor-pointer"
                    onClick={() => openDetail(ret)}
                  >
                    <TableCell className="py-5 px-8">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors font-mono">
                        {ret.id.slice(0, 8)}…
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-[140px]">
                        <span className="text-sm font-medium text-slate-900">{ret.customerName}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{ret.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-slate-600">{ret.orderId.slice(0, 10)}…</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none',
                        TYPE_BADGE[ret.type],
                      )}>
                        {ret.type === 'EXCHANGE' ? <ArrowLeftRight className="h-2 w-2 mr-1 inline" /> : <RotateCcw className="h-2 w-2 mr-1 inline" />}
                        {ret.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600 font-medium">
                        {ret.items?.length ?? 0} item{(ret.items?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full shrink-0', STATUS_DOT[ret.status])} />
                        <Badge className={cn(
                          'rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none whitespace-nowrap',
                          STATUS_BADGE[ret.status],
                        )}>
                          {ret.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{formatDate(ret.createdAt)}</span>
                    </TableCell>
                    <TableCell className="px-8 text-right" onClick={e => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDetail(ret)}
                        className="h-9 w-9 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center text-muted-foreground text-sm">
                      No return requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto no-scrollbar">
          {selectedReturn && (
            <>
              <SheetHeader className="pb-6 border-b">
                <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
                  <RotateCcw className="h-3 w-3" />
                  {selectedReturn.type === 'EXCHANGE' ? 'Exchange Request' : 'Return Request'}
                </div>
                <SheetTitle className="text-2xl font-headline font-bold uppercase font-mono">
                  {selectedReturn.id}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Submitted {formatDate(selectedReturn.createdAt)} · Order {selectedReturn.orderId.slice(0, 12)}…
                </SheetDescription>
              </SheetHeader>

              <div className="py-8 space-y-8">

                {/* Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Type</p>
                    <Badge className={cn(
                      'rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none',
                      TYPE_BADGE[selectedReturn.type],
                    )}>
                      {selectedReturn.type === 'EXCHANGE'
                        ? <ArrowLeftRight className="h-2 w-2 mr-1 inline" />
                        : <RotateCcw className="h-2 w-2 mr-1 inline" />
                      }
                      {selectedReturn.type}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Status</p>
                    <Badge className={cn(
                      'rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none',
                      STATUS_BADGE[selectedReturn.status],
                    )}>
                      {selectedReturn.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Reason</h3>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedReturn.reason}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Items Requested</h3>
                  <div className="space-y-3">
                    {(selectedReturn.items ?? []).map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                          {item.productImage
                            ? <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                            : <Package className="h-4 w-4 text-slate-400 m-auto mt-4" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {item.size && (
                              <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                                Size: {item.size}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 font-medium">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Admin Notes</Label>
                  <Textarea
                    placeholder="Add internal notes about this return..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="rounded-xl border-slate-200 resize-none h-24 text-xs"
                  />
                </div>

                {/* Refund Amount */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Refund Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={refundAmount}
                    onChange={e => setRefundAmount(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 font-bold"
                  />
                </div>
              </div>

              <SheetFooter className="sticky bottom-0 bg-white pt-4 border-t gap-2 flex-col">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate('APPROVED')}
                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12 bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate('REJECTED')}
                    variant="outline"
                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12 text-red-600 border-red-200 hover:bg-red-50 gap-2"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate('COMPLETED')}
                    variant="outline"
                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12 text-slate-600 border-slate-200 hover:bg-slate-50 gap-2"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    Mark Completed
                  </Button>
                  <Button
                    disabled={isUpdating}
                    onClick={() => handleStatusUpdate('EXCHANGE_DISPATCHED')}
                    variant="outline"
                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12 text-blue-600 border-blue-200 hover:bg-blue-50 gap-2"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                    Exchange Dispatched
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
