'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Truck, 
  CheckCircle2, 
  Download,
  Calendar,
  IndianRupee,
  Phone,
  ArrowRight,
  User,
  MapPin,
  CreditCard,
  ClipboardList,
  Package,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser, type WithId } from '@/firebase';
import { getAllOrdersQuery, updateOrderStatus, verifyOrderPayment, type OrderData } from '@/firebase/firestore/orders';

export default function OrdersAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<WithId<OrderData> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Live Firestore Data - Defensive Query
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getAllOrdersQuery(db);
  }, [db, user]);

  const { data: orders, isLoading } = useCollection<OrderData>(ordersQuery);

  const filteredOrders = (orders ?? []).filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && order.orderStatus.toLowerCase() === activeTab.toLowerCase();
  });

  const handleUpdateStatus = async (status: OrderData['orderStatus']) => {
    if (!selectedOrder) return;
    try {
      await updateOrderStatus(db, selectedOrder.userId, selectedOrder.id, status);
      toast({ title: "Status Updated", description: `Order ${selectedOrder.id} is now ${status}.` });
      setIsDetailOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not update order status." });
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    try {
      await verifyOrderPayment(db, selectedOrder.userId, selectedOrder.id);
      toast({ title: "Payment Verified", description: `UPI payment for order ${selectedOrder.id} has been confirmed.` });
      setIsDetailOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Verification Failed", description: "Could not verify payment." });
    }
  };

  const openOrderDetails = (order: WithId<OrderData>) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const formatDate = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Order Management</h1>
          <p className="text-sm text-muted-foreground">Track sales, verify UPI payments, and manage fulfillment.</p>
        </div>
        <Button variant="outline" className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 border-slate-200">
          <Download className="h-4 w-4 mr-2" /> Export Orders
        </Button>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto self-start overflow-x-auto max-w-full no-scrollbar">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all whitespace-nowrap"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search order ID, customer..." 
                  className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-xs font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-100 bg-white shadow-sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Tabs>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-50">
                  <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 py-6">Order</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer Details</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Total</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Fulfillment</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                    <TableCell className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{order.id}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-1">
                          <Calendar className="h-3 w-3" /> 
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 leading-tight">{order.name}</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
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
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none",
                        order.paymentStatus === 'CONFIRMED' ? "bg-green-100 text-green-700" :
                        order.paymentStatus === 'VERIFICATION_PENDING' ? "bg-purple-100 text-purple-700" :
                        order.paymentStatus === 'REFUNDED' ? "bg-slate-100 text-slate-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          order.orderStatus === 'DELIVERED' ? "bg-green-500" :
                          order.orderStatus === 'SHIPPED' ? "bg-blue-500" :
                          order.orderStatus === 'PROCESSING' ? "bg-purple-500" :
                          order.orderStatus === 'CANCELLED' ? "bg-slate-300" :
                          "bg-amber-500"
                        )} />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{order.orderStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openOrderDetails(order)} className="h-9 w-9 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1.5">Quick Update</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setSelectedOrder(order); handleUpdateStatus('PROCESSING'); }} className="rounded-lg gap-2 cursor-pointer">
                              <Loader2 className="h-4 w-4 text-purple-500" /> <span className="text-xs font-bold uppercase tracking-widest">Mark Processing</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedOrder(order); handleUpdateStatus('SHIPPED'); }} className="rounded-lg gap-2 cursor-pointer text-blue-600 focus:text-blue-600">
                              <Truck className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-widest">Mark as Shipped</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedOrder(order); handleUpdateStatus('DELIVERED'); }} className="rounded-lg gap-2 cursor-pointer text-green-600 focus:text-green-600">
                              <CheckCircle2 className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-widest">Mark as Delivered</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                            <DropdownMenuItem onClick={() => openOrderDetails(order)} className="rounded-lg gap-2 cursor-pointer">
                              <ArrowRight className="h-4 w-4 text-slate-400" /> <span className="text-xs font-medium">View Detailed Flow</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-slate-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold">No orders found</p>
                          <p className="text-xs text-muted-foreground">Keep curating, orders will arrive soon.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto no-scrollbar">
          <SheetHeader className="pb-6 border-b">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
              <ClipboardList className="h-3 w-3" /> Boutique Admin
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">Order {selectedOrder?.id}</SheetTitle>
            <SheetDescription className="text-xs">Placed on {formatDate(selectedOrder?.createdAt)}</SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Fulfillment</p>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold uppercase">{selectedOrder?.orderStatus}</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Payment</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold uppercase">{selectedOrder?.paymentStatus}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Customer Details</h3>
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <User className="h-5 w-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold leading-none">{selectedOrder?.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedOrder?.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedOrder?.addressJson ? JSON.parse(selectedOrder.addressJson).line1 : ''}
                    <br />
                    {selectedOrder?.addressJson ? `${JSON.parse(selectedOrder.addressJson).city}, ${JSON.parse(selectedOrder.addressJson).pincode}` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder?.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span>₹{selectedOrder?.deliveryCharge?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-primary pt-2">
                  <span>Total Paid</span>
                  <span>₹{selectedOrder?.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedOrder?.paymentStatus === 'VERIFICATION_PENDING' && selectedOrder?.paymentScreenshotUrl && (
              <div className="space-y-4 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700">Payment Verification Required</h3>
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-md border-4 border-white">
                  <Image src={selectedOrder.paymentScreenshotUrl} alt="UPI Screenshot" fill className="object-cover" />
                </div>
                <Button onClick={handleVerifyPayment} className="w-full bg-purple-600 hover:bg-purple-700 font-bold uppercase text-[10px] tracking-widest h-12">
                  Confirm UPI Verification
                </Button>
              </div>
            )}
          </div>

          <SheetFooter className="pt-6 border-t mt-auto flex-col sm:flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button onClick={() => handleUpdateStatus('SHIPPED')} variant="outline" className="rounded-xl font-bold uppercase text-[9px] tracking-widest gap-2">
                <Truck className="h-3 w-3" /> Mark Shipped
              </Button>
              <Button onClick={() => handleUpdateStatus('DELIVERED')} variant="outline" className="rounded-xl font-bold uppercase text-[9px] tracking-widest gap-2">
                <CheckCircle2 className="h-3 w-3" /> Mark Delivered
              </Button>
            </div>
            <Button onClick={() => handleUpdateStatus('CANCELLED')} variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold uppercase text-[9px] tracking-widest">
              Cancel Order
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
