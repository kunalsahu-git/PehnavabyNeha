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
  updateOrderTracking, verifyOrderPayment,
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
      const orderStatus = (o.orderStatus || (o as any).status || 'PENDING').toUpperCase() as OrderData['orderStatus'];
      const paymentStatus = (o.paymentStatus || (o as any).paymentStatus || 'PENDING').toUpperCase() as OrderData['paymentStatus'];
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

  const handleVerifyPayment = async (order: WithId<OrderData>) => {
    if (!db) return;
    setIsUpdating(true);
    try {
      await verifyOrderPayment(db, order.userId, order.id);
      toast({ title: 'Payment confirmed', description: `Order ${order.id} payment verified.` });
      setIsDetailOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Verification failed' });
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
                       {['PENDING', 'VERIFICATION_PENDING', 'CONFIRMED', 'REFUNDED'].map(s => (
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
                    {(selectedOrder.paymentScreenshotUrl || (selectedOrder as any).receiptUrl) && (
                      <div className="relative aspect-[3/4] w-full max-w-[200px] rounded-xl overflow-hidden shadow-md border-4 border-white">
                        <Image src={selectedOrder.paymentScreenshotUrl || (selectedOrder as any).receiptUrl} alt="UPI Screenshot" fill className="object-contain bg-white" />
                      </div>
                    )}
                    <Button onClick={() => handleVerifyPayment(selectedOrder)} disabled={isUpdating} className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-amber-200 transition-all">
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackageCheck className="h-4 w-4 mr-2" />}
                      Verify Payment & Accept Order
                    </Button>
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

              <SheetFooter className="sticky bottom-0 bg-white pt-4 border-t gap-2">
                <div className="grid grid-cols-3 gap-2 w-full">
                  <Button
                    variant="outline"
                    disabled={isUpdating || selectedOrder.orderStatus === 'PROCESSING'}
                    onClick={() => handleUpdateStatus(selectedOrder, 'PROCESSING')}
                    className="rounded-xl font-bold uppercase text-[8px] tracking-widest gap-1.5 flex-col h-14"
                  >
                    <Package className="h-4 w-4" /> Processing
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isUpdating || selectedOrder.orderStatus === 'SHIPPED'}
                    onClick={() => { setIsShipDialogOpen(true); }}
                    className="rounded-xl font-bold uppercase text-[8px] tracking-widest gap-1.5 flex-col h-14 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Truck className="h-4 w-4" /> Shipped
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isUpdating || selectedOrder.orderStatus === 'DELIVERED'}
                    onClick={() => handleUpdateStatus(selectedOrder, 'DELIVERED')}
                    className="rounded-xl font-bold uppercase text-[8px] tracking-widest gap-1.5 flex-col h-14 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <PackageCheck className="h-4 w-4" /> Delivered
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  disabled={isUpdating || selectedOrder.orderStatus === 'CANCELLED'}
                  onClick={() => handleUpdateStatus(selectedOrder, 'CANCELLED')}
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold uppercase text-[10px] tracking-widest h-11"
                >
                  Cancel Order
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
