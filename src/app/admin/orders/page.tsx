'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Search, Filter, MoreVertical, Eye, Truck, CheckCircle2,
  Download, Calendar, IndianRupee, Phone, User, MapPin,
  CreditCard, ClipboardList, Package, Loader2, X,
  PackageCheck, AlertCircle, ExternalLink,
} from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser, type WithId } from '@/firebase';
import {
  getAllOrdersQuery, getOrderItemsQuery, updateOrderStatus,
  updateOrderTracking, verifyOrderPayment,
  type OrderData, type OrderItemData,
} from '@/firebase/firestore/orders';

// ── Order items sub-component (separate so hooks are unconditional) ────────────
function OrderItemsList({ userId, orderId }: { userId: string; orderId: string }) {
  const db = useFirestore();
  const itemsQuery = useMemoFirebase(
    () => db ? getOrderItemsQuery(db, userId, orderId) : null,
    [db, userId, orderId]
  );
  const { data: items, isLoading } = useCollection<OrderItemData>(itemsQuery);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
      </div>
    );
  }
  if (!items?.length) {
    return <p className="text-xs text-muted-foreground py-4 text-center">No items found.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
            {item.productImage
              ? <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
              : <Package className="h-4 w-4 text-slate-400 m-auto mt-4" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {item.size && <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">Size: {item.size}</span>}
              {item.color && <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{item.color}</span>}
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WithId<OrderData> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getAllOrdersQuery(db);
  }, [db, user]);

  const { data: orders, isLoading } = useCollection<OrderData>(ordersQuery);

  const countFor = (status: OrderData['orderStatus']) =>
    (orders ?? []).filter(o => o.orderStatus === status).length;

  const filteredOrders = (orders ?? []).filter(order => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      order.id.toLowerCase().includes(term) ||
      order.name.toLowerCase().includes(term) ||
      order.phone.includes(term);
    const matchesTab = activeTab === 'all' || order.orderStatus === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleUpdateStatus = async (order: WithId<OrderData>, status: OrderData['orderStatus']) => {
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

  const handleShip = async () => {
    if (!selectedOrder) return;
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Order Management</h1>
          <p className="text-sm text-muted-foreground">Track sales, verify UPI payments, and manage fulfillment.</p>
        </div>
        <Button variant="outline" className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 border-slate-200">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="space-y-6">
        {/* Tabs + Search */}
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
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none",
                      "bg-current/10"
                    )}>
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
                className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-xs font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-100 bg-white shadow-sm shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-50">
                  <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 py-6">Order</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fulfillment</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                    <TableCell className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors font-mono">{order.id.slice(0, 8)}…</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{order.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Phone className="h-2.5 w-2.5" /> {order.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                        <IndianRupee className="h-3 w-3 text-slate-400" />
                        {order.total.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none", paymentBadge(order.paymentStatus))}>
                        {order.paymentStatus === 'VERIFICATION_PENDING' ? 'Verify UPI' : order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", statusColor(order.orderStatus))} />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{order.orderStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openDetail(order)} className="h-9 w-9 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all" title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-slate-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 rounded-xl p-2">
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
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-slate-200" />
                        </div>
                        <p className="text-sm font-bold">{searchTerm ? 'No orders match your search' : 'No orders yet'}</p>
                        <p className="text-xs text-muted-foreground">
                          {searchTerm ? 'Try a different search.' : 'Orders will appear here once customers place them.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Ship Dialog — captures courier + tracking before marking shipped */}
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
            <p className="text-[10px] text-muted-foreground">Both fields are optional but recommended for customer communication.</p>
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

      {/* Order Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto no-scrollbar">
          {selectedOrder && (
            <>
              <SheetHeader className="pb-6 border-b">
                <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
                  <ClipboardList className="h-3 w-3" /> Order Details
                </div>
                <SheetTitle className="text-2xl font-headline font-bold uppercase font-mono">{selectedOrder.id}</SheetTitle>
                <SheetDescription className="text-xs">
                  Placed {formatDate(selectedOrder.createdAt, true)}
                </SheetDescription>
              </SheetHeader>

              <div className="py-8 space-y-8">

                {/* Status pills */}
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

                {/* Tracking info if shipped */}
                {selectedOrder.orderStatus === 'SHIPPED' && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-700">Tracking Info</p>
                    <p className="text-xs font-bold text-blue-900">{selectedOrder.courierName || 'Courier not specified'}</p>
                    <p className="text-xs font-mono text-blue-700">{selectedOrder.trackingNumber || 'No tracking number'}</p>
                  </div>
                )}

                {/* Customer */}
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

                {/* Order Items */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Items Ordered</h3>
                  <OrderItemsList userId={selectedOrder.userId} orderId={selectedOrder.id} />
                </div>

                {/* Price Summary */}
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
                      <span>₹{selectedOrder.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* UPI Verification */}
                {selectedOrder.paymentStatus === 'VERIFICATION_PENDING' && selectedOrder.paymentScreenshotUrl && (
                  <div className="space-y-4 bg-purple-50 p-5 rounded-2xl border border-purple-100">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5" /> Payment Verification Required
                    </h3>
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-md border-4 border-white">
                      <Image src={selectedOrder.paymentScreenshotUrl} alt="UPI Screenshot" fill className="object-contain bg-white" />
                    </div>
                    <Button
                      onClick={() => handleVerifyPayment(selectedOrder)}
                      disabled={isUpdating}
                      className="w-full bg-purple-600 hover:bg-purple-700 font-bold uppercase text-[10px] tracking-widest h-12 rounded-xl"
                    >
                      {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                      Confirm UPI Payment
                    </Button>
                  </div>
                )}
              </div>

              <SheetFooter className="pt-6 border-t flex-col sm:flex-col gap-3">
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
