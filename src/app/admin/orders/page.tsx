'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Filter, MoreVertical, Eye, Truck, CheckCircle2,
  Download, Calendar, IndianRupee, Phone, User, MapPin,
  CreditCard, ClipboardList, Package, Loader2, X,
  PackageCheck, AlertCircle, ExternalLink, Check, Trash2,
} from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';
import { BulkActionToolbar } from '@/components/admin/BulkActionToolbar';
import { exportToCSV } from '@/lib/export-utils';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser, type WithId } from '@/firebase';
import {
  getAllOrdersQuery, getOrderItemsQuery, updateOrderStatus,
  updateOrderTracking, verifyOrderPayment, rejectOrderPayment, decrementStockForOrder,
  type OrderData, type OrderItemData,
} from '@/firebase/firestore/orders';
import { getBoutiqueSettings, BoutiqueSettings } from '@/firebase/firestore/settings';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { getTrackingUrl } from '@/lib/tracking-utils';
import { getDocs } from 'firebase/firestore';

// ── Order items sub-component (separate so hooks are unconditional) ────────────
function OrderItemsList({ userId, orderId, fallbackItems }: { userId: string; orderId: string; fallbackItems?: any[] }) {
  const db = useFirestore();
  const itemsQuery = useMemoFirebase(
    () => db ? getOrderItemsQuery(db, userId, orderId) : null,
    [db, userId, orderId]
  );
  const { data: subItems, isLoading } = useCollection<OrderItemData>(itemsQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
      </div>
    );
  }

  const items = (subItems && subItems.length > 0) ? subItems : fallbackItems;

  if (!items?.length) {
    return <p className="text-xs text-muted-foreground py-4 text-center">No items found.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item: any) => (
        <div key={item.productId || item.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
            {(item.productImage || item.image)
              ? <Image src={item.productImage || item.image} alt={item.productName || item.name} fill className="object-cover" />
              : <Package className="h-4 w-4 text-slate-400 m-auto mt-4" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{item.productName || item.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {item.size && <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">Size: {item.size}</span>}
              {(item.color) && <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{item.color}</span>}
              <span className="text-[9px] text-slate-400 font-medium">Qty: {item.quantity}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</p>
            {item.originalPrice && (
              <p className="text-[9px] text-muted-foreground line-through">₹{(item.originalPrice * item.quantity).toLocaleString()}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Status helpers ─────────────────────────────────────────────────────────────
const ORDER_STATUSES: OrderData['orderStatus'][] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

function parseAddress(json: string | undefined) {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

function formatDate(ts: any, full = false) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
    ...(full ? { year: 'numeric', hour: '2-digit', minute: '2-digit' } : {}),
  });
}

const statusColor = (s: OrderData['orderStatus']) =>
  s === 'DELIVERED' ? 'bg-green-500' :
  s === 'SHIPPED'   ? 'bg-blue-500' :
  s === 'PROCESSING'? 'bg-purple-500' :
  s === 'CANCELLED' ? 'bg-slate-300' : 'bg-amber-500';

const statusBadge = (s: OrderData['orderStatus']) =>
  s === 'DELIVERED' ? 'bg-green-100 text-green-700' :
  s === 'SHIPPED'   ? 'bg-blue-100 text-blue-700' :
  s === 'PROCESSING'? 'bg-purple-100 text-purple-700' :
  s === 'CANCELLED' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700';

const paymentBadge = (s: OrderData['paymentStatus']) =>
  s === 'CONFIRMED'             ? 'bg-green-100 text-green-700' :
  s === 'VERIFICATION_PENDING'  ? 'bg-purple-100 text-purple-700' :
  s === 'FAILED'                ? 'bg-red-100 text-red-700' :
  s === 'REFUNDED'              ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700';

// ── Main component ─────────────────────────────────────────────────────────────
export default function OrdersAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | OrderData['orderStatus']>('all');
  const [selectedOrder, setSelectedOrder] = useState<WithId<OrderData> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [boutiqueSettings, setBoutiqueSettings] = useState<BoutiqueSettings | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Confirmation dialogs
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
  const [isRejectPaymentOpen, setIsRejectPaymentOpen] = useState(false);

  // Receipt lightbox
  const [receiptLightboxUrl, setReceiptLightboxUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = React.useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  // Fetch boutique settings for invoice branding
  React.useEffect(() => {
    if (db) {
      getBoutiqueSettings(db).then(setBoutiqueSettings);
    }
  }, [db]);

  const handleDownloadInvoice = async (order: WithId<OrderData>) => {
    if (!db) return;
    setIsGeneratingInvoice(true);
    try {
      // Fetch full items list for the invoice
      const itemsSnap = await getDocs(getOrderItemsQuery(db, order.userId, order.id));
      const items = itemsSnap.docs.map(d => d.data() as OrderItemData);
      
      // Fallback to order.items if subcollection is empty
      const finalItems = items.length > 0 ? items : (order.items || []);
      
      await generateInvoicePDF(order, finalItems as OrderItemData[], boutiqueSettings);
      toast({ title: 'Invoice Ready', description: 'Your invoice has been generated and downloaded.' });
    } catch (error) {
      console.error('Invoice generation failed:', error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not create the invoice PDF.' });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getAllOrdersQuery(db);
  }, [db, user]);

  const { data: orders, isLoading } = useCollection<OrderData>(ordersQuery);

  const {
    searchTerm, setSearchTerm,
    filteredData,
    toggleSort, sortConfig,
    setFilter, filters,
    selectedIds, toggleSelect, toggleSelectAll, setSelectedIds
  } = useDataTable<WithId<OrderData>>({
    data: (orders ?? []).map(o => {
      const rawOrder = ((o.orderStatus || (o as any).status || 'PENDING') as string).toUpperCase().trim();
      const rawPayment = ((o.paymentStatus || 'PENDING') as string).toUpperCase().trim();

      // Normalize legacy order statuses
      const orderStatus = (
        rawOrder === 'COMPLETE' ? 'DELIVERED' : rawOrder
      ) as OrderData['orderStatus'];

      // Normalize legacy payment statuses from old data
      const paymentStatus = (
        rawPayment === 'PENDING VERIFICATION' ||
        rawPayment === 'PENDING_VERIFICATION' ||
        rawPayment === 'PENDING RECEIPT'       ||
        rawPayment === 'AWAITING VERIFICATION' ||
        rawPayment === 'SUBMITTED'
          ? 'VERIFICATION_PENDING'
        : rawPayment === 'PAID'    ? 'CONFIRMED'
        : rawPayment === 'FAILED'  ? 'FAILED'
        : rawPayment === 'REFUNDED'? 'REFUNDED'
        : rawPayment === 'CONFIRMED' ? 'CONFIRMED'
        : rawPayment === 'VERIFICATION_PENDING' ? 'VERIFICATION_PENDING'
        : 'PENDING'
      ) as OrderData['paymentStatus'];

      return { ...o, orderStatus, paymentStatus };
    }),
    searchFields: ['id', 'name', 'phone'],
    initialSort: { key: 'createdAt', direction: 'desc' }
  });

  // Sync activeTab with DataTable filters
  React.useEffect(() => {
    if (activeTab === 'all') {
      setFilter('orderStatus', null);
    } else {
      setFilter('orderStatus', activeTab);
    }
  }, [activeTab, setFilter]);

  const countFor = (status: OrderData['orderStatus']) =>
    (orders ?? []).filter(o => o.orderStatus === status).length;

  const handleUpdateStatus = async (order: WithId<OrderData>, status: OrderData['orderStatus']) => {
    if (!db) return;
    setIsUpdating(true);
    try {
      await updateOrderStatus(db, order.userId, order.id, status);
      toast({ title: 'Status updated', description: `Order ${order.id} → ${status}` });
      setIsDetailOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Update failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkUpdateStatus = async (status: OrderData['orderStatus']) => {
    if (selectedIds.size === 0 || !db) return;
    setIsUpdating(true);
    try {
      const selectedOrders = (orders ?? []).filter(o => selectedIds.has(o.id));
      await Promise.all(selectedOrders.map(o => updateOrderStatus(db, o.userId, o.id, status)));
      toast({ title: 'Bulk Update Success', description: `Updated ${selectedIds.size} orders to ${status}.` });
      setSelectedIds(new Set());
    } catch {
      toast({ variant: 'destructive', title: 'Bulk update failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(o => ({
      OrderID: o.id,
      Date: formatDate(o.createdAt, true),
      Customer: o.name,
      Phone: o.phone,
      Total: o.total,
      PaymentStatus: o.paymentStatus,
      FulfillmentStatus: o.orderStatus,
      Courier: o.courierName || '',
      Tracking: o.trackingNumber || ''
    }));
    exportToCSV(exportData, 'pehnava_orders');
  };

  const handleShip = async () => {
    if (!selectedOrder || !db) return;
    setIsUpdating(true);
    try {
      await updateOrderTracking(db, selectedOrder.userId, selectedOrder.id, courierName, trackingNumber);
      toast({ title: 'Marked as Shipped', description: `Tracking: ${trackingNumber || 'N/A'}` });
      setIsShipDialogOpen(false);
      setIsDetailOpen(false);
      setCourierName(''); setTrackingNumber('');
    } catch {
      toast({ variant: 'destructive', title: 'Update failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectPayment = async (order: WithId<OrderData>) => {
    if (!db) return;
    setIsUpdating(true);
    try {
      await rejectOrderPayment(db, order.userId, order.id);
      toast({ title: 'Payment rejected', description: `Order ${order.id.slice(0, 8)} marked as failed and cancelled.` });
      setIsDetailOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Rejection failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyPayment = async (order: WithId<OrderData>) => {
    if (!db) return;
    setIsUpdating(true);
    try {
      await verifyOrderPayment(db, order.userId, order.id);

      // Decrement stock for each item in the order
      const itemsSnap = await getDocs(getOrderItemsQuery(db, order.userId, order.id));
      const items = itemsSnap.docs.map(d => d.data() as OrderItemData);
      const stockItems = (items.length > 0 ? items : (order.items || [])).map((i: any) => ({
        productId: i.productId || i.id,
        quantity: i.quantity,
      })).filter((i: any) => i.productId);

      if (stockItems.length > 0) {
        await decrementStockForOrder(db, stockItems);
      }

      toast({ title: 'Payment confirmed', description: `Order ${order.id} payment verified and stock updated.` });
      setIsDetailOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Verification failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateAWB = async (order: WithId<OrderData>) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const addr = order.addressJson ? JSON.parse(order.addressJson) : {};
      const res = await fetch('/api/shiprocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_order',
          order: {
            orderId: order.id,
            customerName: order.name,
            phone: order.phone,
            email: '',
            address: addr,
            items: order.items || [],
            subtotal: order.subtotal,
            deliveryCharge: order.deliveryCharge,
            discount: (order as any).discount || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.awb) {
        await updateOrderTracking(db, order.userId, order.id, data.courierName, data.awb);
        toast({ title: 'AWB Generated!', description: `AWB: ${data.awb} via ${data.courierName}` });
        setIsDetailOpen(false);
      } else {
        toast({ title: 'Order created in Shiprocket', description: 'AWB assignment pending. Check Shiprocket dashboard.' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'AWB Generation Failed', description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const openDetail = (order: WithId<OrderData>) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const TABS = [
    { value: 'all', label: 'All', count: (orders ?? []).length },
    { value: 'PENDING', label: 'Pending', count: countFor('PENDING') },
    { value: 'PROCESSING', label: 'Processing', count: countFor('PROCESSING') },
    { value: 'SHIPPED', label: 'Shipped', count: countFor('SHIPPED') },
    { value: 'DELIVERED', label: 'Delivered', count: countFor('DELIVERED') },
    { value: 'CANCELLED', label: 'Cancelled', count: countFor('CANCELLED') },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Order Management</h1>
          <p className="text-sm text-muted-foreground">Track sales, verify UPI payments, and manage fulfillment.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleExportCSV}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 border-slate-200"
        >
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <Tabs value={activeTab} className="w-auto" onValueChange={v => setActiveTab(v as any)}>
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto overflow-x-auto max-w-full no-scrollbar flex flex-wrap gap-1">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap flex items-center gap-2"
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none bg-current/10">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID, customer, phone..."
                className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-100 bg-white shadow-sm shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl p-4 shadow-2xl border-slate-100" align="end">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Filters</h4>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Payment Status</Label>
                    <div className="flex flex-wrap gap-2">
                       {['PENDING', 'VERIFICATION_PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED'].map(s => (
                        <Button 
                          key={s}
                          variant={filters.find(f => f.key === 'paymentStatus')?.value === s ? 'default' : 'outline'} 
                          size="sm" 
                          className="rounded-lg text-[8px] h-7 font-bold uppercase"
                          onClick={() => setFilter('paymentStatus', filters.find(f => f.key === 'paymentStatus')?.value === s ? null : s)}
                        >
                          {s.replace('_', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <BulkActionToolbar 
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          actions={[
            { label: 'Mark Processing', icon: <Loader2 className="h-3 w-3" />, onClick: () => handleBulkUpdateStatus('PROCESSING') },
            { label: 'Mark Delivered', icon: <CheckCircle2 className="h-3 w-3" />, onClick: () => handleBulkUpdateStatus('DELIVERED') },
            { label: 'Cancel', icon: <X className="h-3 w-3" />, onClick: () => handleBulkUpdateStatus('CANCELLED'), variant: 'destructive' }
          ]}
        />

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-50">
                    <TableHead className="w-12 px-8">
                      <Checkbox 
                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                        onCheckedChange={() => toggleSelectAll()}
                        className="rounded-md border-slate-300"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-400 py-6"
                      onClick={() => toggleSort('createdAt')}
                    >
                      Order {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
                    <TableHead 
                      className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-400"
                      onClick={() => toggleSort('total')}
                    >
                      Total {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fulfillment</TableHead>
                    <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? filteredData.map(order => (
                    <TableRow key={order.id} className={cn(
                      "hover:bg-slate-50/50 border-slate-50 transition-colors group",
                      selectedIds.has(order.id) && "bg-primary/5 hover:bg-primary/5"
                    )}>
                      <TableCell className="px-8">
                        <Checkbox 
                          checked={selectedIds.has(order.id)}
                          onCheckedChange={() => toggleSelect(order.id)}
                          className="rounded-md border-slate-300"
                        />
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col min-w-[120px]">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors font-mono">{order.id.slice(0, 8)}…</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-[150px]">
                          <span className="text-sm font-medium text-slate-900">{order.name}</span>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Phone className="h-2.5 w-2.5" /> {order.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-bold text-slate-900 min-w-[100px]">
                          <IndianRupee className="h-3 w-3 text-slate-400" />
                          {order.total.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none whitespace-nowrap", paymentBadge(order.paymentStatus))}>
                          {order.paymentStatus.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className={cn("h-2 w-2 rounded-full shrink-0", statusColor(order.orderStatus))} />
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{order.orderStatus}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openDetail(order)} className="h-9 w-9 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-slate-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl p-2">
                              {/* ... menu items ... */}
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1.5">Quick Update</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => handleUpdateStatus(order, 'PROCESSING')}>
                                <Loader2 className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-bold uppercase tracking-widest">Mark Processing</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-blue-600 focus:text-blue-600" onClick={() => { setSelectedOrder(order); setIsShipDialogOpen(true); }}>
                                <Truck className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Mark Shipped</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-green-600 focus:text-green-600" onClick={() => handleUpdateStatus(order, 'DELIVERED')}>
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Mark Delivered</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-100" />
                              <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50" onClick={() => handleUpdateStatus(order, 'CANCELLED')}>
                                <X className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Cancel Order</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center text-muted-foreground text-sm">
                        No orders found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isShipDialogOpen} onOpenChange={open => { setIsShipDialogOpen(open); if (!open) { setCourierName(''); setTrackingNumber(''); } }}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase tracking-wider">Mark as Shipped</DialogTitle>
            <DialogDescription className="text-xs">Enter shipping details for order {selectedOrder?.id?.slice(0, 8)}…</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Courier / Shipping Partner</Label>
              <Input
                placeholder="e.g. Delhivery, BlueDart, DTDC"
                className="h-12 rounded-xl"
                value={courierName}
                onChange={e => setCourierName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tracking Number</Label>
              <Input
                placeholder="e.g. DL1234567890IN"
                className="h-12 rounded-xl font-mono"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setIsShipDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleShip} disabled={isUpdating} className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold uppercase text-[10px] tracking-widest">
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
              Confirm Shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Order Confirmation ── */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase tracking-wider text-red-600">Cancel Order?</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              This will cancel order <span className="font-mono font-bold">{selectedOrder?.id?.slice(0, 8)}…</span> for <span className="font-bold">{selectedOrder?.name}</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-xl flex-1" onClick={() => setIsCancelConfirmOpen(false)}>Keep Order</Button>
            <Button
              disabled={isUpdating}
              className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 font-bold uppercase text-[10px] tracking-widest"
              onClick={async () => {
                if (!selectedOrder) return;
                setIsCancelConfirmOpen(false);
                await handleUpdateStatus(selectedOrder, 'CANCELLED');
              }}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Payment Confirmation ── */}
      <Dialog open={isConfirmPaymentOpen} onOpenChange={setIsConfirmPaymentOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase tracking-wider text-green-700">Confirm Payment Received?</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              You're confirming that ₹{selectedOrder?.total?.toLocaleString()} has been received from <span className="font-bold">{selectedOrder?.name}</span>. The order will move to <span className="font-bold">PROCESSING</span> and stock will be decremented.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-xl flex-1" onClick={() => setIsConfirmPaymentOpen(false)}>Go Back</Button>
            <Button
              disabled={isUpdating}
              className="rounded-xl flex-1 bg-green-600 hover:bg-green-700 font-bold uppercase text-[10px] tracking-widest"
              onClick={async () => {
                if (!selectedOrder) return;
                setIsConfirmPaymentOpen(false);
                await handleVerifyPayment(selectedOrder);
              }}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackageCheck className="h-4 w-4 mr-2" />}
              Yes, Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Payment Confirmation ── */}
      <Dialog open={isRejectPaymentOpen} onOpenChange={setIsRejectPaymentOpen}>
        <DialogContent className="rounded-3xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase tracking-wider text-red-600">Reject Payment?</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              You're marking the payment from <span className="font-bold">{selectedOrder?.name}</span> as <span className="font-bold text-red-600">FAILED</span>. The order will be <span className="font-bold">CANCELLED</span>. Only do this if the screenshot is invalid or payment was not received.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-xl flex-1" onClick={() => setIsRejectPaymentOpen(false)}>Go Back</Button>
            <Button
              disabled={isUpdating}
              className="rounded-xl flex-1 bg-red-600 hover:bg-red-700 font-bold uppercase text-[10px] tracking-widest"
              onClick={async () => {
                if (!selectedOrder) return;
                setIsRejectPaymentOpen(false);
                await handleRejectPayment(selectedOrder);
              }}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Yes, Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Receipt Lightbox with Zoom/Pan ── */}
      <Dialog open={!!receiptLightboxUrl} onOpenChange={(open) => { if (!open) setReceiptLightboxUrl(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[95vh] p-0 rounded-3xl overflow-hidden bg-black border-none">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
            <DialogTitle className="text-white text-xs font-bold uppercase tracking-widest">Payment Receipt</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.min(z + 0.5, 4))} className="h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white text-lg font-bold">+</Button>
              <span className="text-white text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
              <Button size="sm" variant="ghost" onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white text-lg font-bold">−</Button>
              <Button size="sm" variant="ghost" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="h-8 px-3 rounded-full bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold uppercase tracking-widest">Reset</Button>
            </div>
          </DialogHeader>
          {receiptLightboxUrl && (
            <div
              className="w-full h-[90vh] overflow-hidden flex items-center justify-center select-none"
              style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.2 : 0.2;
                setZoom(z => Math.min(Math.max(z + delta, 0.5), 5));
              }}
              onMouseDown={(e) => {
                if (zoom <= 1) return;
                setIsDragging(true);
                dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
              }}
              onMouseMove={(e) => {
                if (!isDragging || !dragStart.current) return;
                setPan({ x: dragStart.current.px + (e.clientX - dragStart.current.x), y: dragStart.current.py + (e.clientY - dragStart.current.y) });
              }}
              onMouseUp={() => { setIsDragging(false); dragStart.current = null; }}
              onMouseLeave={() => { setIsDragging(false); dragStart.current = null; }}
              onClick={() => { if (zoom <= 1) setZoom(2); }}
            >
              <div style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transition: isDragging ? 'none' : 'transform 0.15s ease' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={receiptLightboxUrl} alt="Payment Receipt" className="max-w-full max-h-[85vh] object-contain rounded-xl" draggable={false} />
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Scroll or click to zoom · Drag to pan</p>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto no-scrollbar">
          {selectedOrder && (
            <>
              <SheetHeader className="pb-6 border-b relative">
                <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
                  <ClipboardList className="h-3 w-3" /> Order Details
                </div>
                <SheetTitle className="text-2xl font-headline font-bold uppercase font-mono">{selectedOrder.id}</SheetTitle>
                <SheetDescription className="text-xs">
                  Placed {formatDate(selectedOrder.createdAt, true)}
                  {selectedOrder.trackingNumber && (
                    <Link 
                      href={getTrackingUrl(selectedOrder.courierName, selectedOrder.trackingNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary hover:underline inline-flex items-center gap-1"
                    >
                      (Track <ExternalLink className="h-2 w-2" />)
                    </Link>
                  )}
                </SheetDescription>

                {/* Download Button in Header */}
                <div className="absolute right-6 top-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-accent/20 text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
                    disabled={isGeneratingInvoice}
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                  >
                    {isGeneratingInvoice ? (
                      <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Generating...</>
                    ) : (
                      <><Download className="mr-2 h-3 w-3" /> Invoice</>
                    )}
                  </Button>
                </div>
              </SheetHeader>

              <div className="py-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Fulfillment</p>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", statusColor(selectedOrder.orderStatus))} />
                      <span className="text-sm font-bold uppercase">{selectedOrder.orderStatus}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Payment</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold uppercase">{selectedOrder.paymentStatus}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.paymentStatus === 'VERIFICATION_PENDING' && (
                  <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex flex-col items-center text-center gap-4">
                    <AlertCircle className="h-10 w-10 text-amber-500" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 uppercase tracking-widest">UPI Verification Required</h4>
                      <p className="text-xs text-amber-700 mt-1">Please confirm you've received ₹{selectedOrder.total.toLocaleString()} from {selectedOrder.name}.</p>
                    </div>
                    {(selectedOrder.paymentScreenshotUrl || (selectedOrder as any).receiptUrl) && (() => {
                      const receiptUrl = selectedOrder.paymentScreenshotUrl || (selectedOrder as any).receiptUrl;
                      return (
                        <div className="relative w-full">
                          <div
                            className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-md border-4 border-white cursor-zoom-in group"
                            onClick={() => { setReceiptLightboxUrl(receiptUrl); setZoom(1); setPan({ x: 0, y: 0 }); }}
                          >
                            <Image src={receiptUrl} alt="UPI Screenshot" fill className="object-contain bg-white" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full transition-all">View Full</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex gap-3 w-full">
                      <Button onClick={() => setIsConfirmPaymentOpen(true)} disabled={isUpdating} className="flex-1 h-12 rounded-2xl bg-green-600 hover:bg-green-700 font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-green-200 transition-all">
                        <PackageCheck className="h-4 w-4 mr-2" />
                        Confirm Paid
                      </Button>
                      <Button onClick={() => setIsRejectPaymentOpen(true)} disabled={isUpdating} variant="outline" className="flex-1 h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold uppercase text-[10px] tracking-[0.2em] transition-all">
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Customer</h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold">{selectedOrder.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> {selectedOrder.phone}
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const addr = parseAddress(selectedOrder.addressJson);
                      return addr ? (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                            <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                            {addr.country && <p>{addr.country}</p>}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Items Ordered</h3>
                  <OrderItemsList userId={selectedOrder.userId} orderId={selectedOrder.id} fallbackItems={selectedOrder.items} />
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Summary</h3>
                  <div className="space-y-2 bg-slate-50 rounded-2xl p-5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.subtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Shipping</span>
                      <span>{selectedOrder.deliveryCharge === 0 ? 'Free' : `₹${selectedOrder.deliveryCharge?.toLocaleString()}`}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between text-sm font-bold text-primary">
                      <span>Total</span>
                      <span>₹{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="sticky bottom-0 bg-white border-t pt-4 pb-2 px-6 flex flex-col gap-3">
                {/* Fulfillment status row */}
                <div className="w-full space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Move Fulfillment Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { status: 'PROCESSING' as const, label: 'Processing', icon: Package, color: 'text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-400' },
                      { status: 'SHIPPED' as const,    label: 'Shipped',    icon: Truck,       color: 'text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400',  onClick: () => setIsShipDialogOpen(true) },
                      { status: 'DELIVERED' as const,  label: 'Delivered',  icon: PackageCheck, color: 'text-green-600 border-green-200 hover:bg-green-50 hover:border-green-400' },
                    ].map(({ status, label, icon: Icon, color, onClick: customClick }) => {
                      const isActive = selectedOrder.orderStatus === status;
                      return (
                        <Button
                          key={status}
                          variant="outline"
                          disabled={isUpdating || isActive}
                          onClick={customClick ?? (() => handleUpdateStatus(selectedOrder, status))}
                          className={cn(
                            "rounded-xl h-14 flex-col gap-1 font-bold uppercase text-[9px] tracking-widest border-2 transition-all",
                            isActive
                              ? "bg-slate-900 text-white border-slate-900 cursor-default"
                              : color
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                          {isActive && <span className="text-[7px] tracking-widest opacity-70">CURRENT</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* AWB + Cancel row */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    variant="outline"
                    disabled={isUpdating || !!selectedOrder.trackingNumber}
                    onClick={() => handleGenerateAWB(selectedOrder)}
                    className="rounded-xl h-11 font-bold uppercase text-[9px] tracking-widest border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 gap-2 transition-all"
                  >
                    {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                    {selectedOrder.trackingNumber ? `AWB: ${selectedOrder.trackingNumber.slice(0, 10)}` : 'Gen AWB'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isUpdating || selectedOrder.orderStatus === 'CANCELLED'}
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="rounded-xl h-11 font-bold uppercase text-[9px] tracking-widest border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400 gap-2 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel Order
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
