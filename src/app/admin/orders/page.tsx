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
  XCircle,
  Download,
  Calendar,
  IndianRupee,
  Phone,
  ArrowRight,
  User,
  MapPin,
  CreditCard,
  ExternalLink,
  Package,
  ClipboardList
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MOCK_ORDERS = [
  { 
    id: 'PN-82931', 
    customer: 'Anjali Sharma', 
    phone: '+91 98765 43210', 
    date: '2024-01-15', 
    total: 4999, 
    subtotal: 4900,
    shipping: 99,
    status: 'Shipped', 
    payment: 'Verified',
    address: '45A, Rose Avenue, Civil Lines, Jaipur, RJ',
    paymentScreenshot: 'https://placehold.co/400x600/png?text=UPI+Screenshot+1',
    items: [
      { name: 'Crimson Silk Saree', price: 4999, qty: 1, image: 'https://picsum.photos/seed/saree/100/100' }
    ]
  },
  { 
    id: 'PN-82930', 
    customer: 'Priya Verma', 
    phone: '+91 88888 77777', 
    date: '2024-01-15', 
    total: 2499, 
    subtotal: 2400,
    shipping: 99,
    status: 'Processing', 
    payment: 'Verification Pending',
    address: 'Flat 302, Sky Heights, Mumbai, MH',
    paymentScreenshot: 'https://placehold.co/400x600/png?text=UPI+Screenshot+2',
    items: [
      { name: 'Gold Kurta Set', price: 2499, qty: 1, image: 'https://picsum.photos/seed/kurta/100/100' }
    ]
  },
  { id: 'PN-82929', customer: 'Mehak Gill', phone: '+91 77777 66666', date: '2024-01-14', total: 8200, status: 'Delivered', payment: 'Verified' },
  { id: 'PN-82928', customer: 'Sneha Gupta', phone: '+91 99999 88888', date: '2024-01-14', total: 1299, status: 'Pending', payment: 'Unpaid' },
];

export default function OrdersAdminPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  const handleUpdateStatus = (status: string) => {
    toast({
      title: "Status Updated",
      description: `Order ${selectedOrder?.id} is now ${status}.`
    });
    setIsDetailOpen(false);
  };

  const handleVerifyPayment = () => {
    toast({
      title: "Payment Verified",
      description: `UPI payment for order ${selectedOrder?.id} has been confirmed.`
    });
    setIsDetailOpen(false);
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Order Management</h1>
          <p className="text-sm text-muted-foreground">Track sales, verify UPI payments, and manage fulfillment.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 border-slate-200">
            <Download className="h-4 w-4 mr-2" /> Export Orders
          </Button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto self-start">
              {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
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
                />
              </div>
              <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-100 bg-white shadow-sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Tabs>

        {/* Orders Table */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
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
              {MOCK_ORDERS.map((order) => (
                <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                  <TableCell className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{order.id}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-1">
                        <Calendar className="h-3 w-3" /> 
                        {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900 leading-tight">{order.customer}</span>
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
                      order.payment === 'Verified' ? "bg-green-100 text-green-700" :
                      order.payment === 'Verification Pending' ? "bg-purple-100 text-purple-700" :
                      order.payment === 'Refunded' ? "bg-slate-100 text-slate-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {order.payment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        order.status === 'Delivered' ? "bg-green-500" :
                        order.status === 'Shipped' ? "bg-blue-500" :
                        order.status === 'Processing' ? "bg-purple-500" :
                        order.status === 'Cancelled' ? "bg-slate-300" :
                        "bg-amber-500"
                      )} />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{order.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openOrderDetails(order)} className="h-9 w-9 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all group/btn">
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
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-blue-600 focus:text-blue-600">
                            <Truck className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-widest">Mark as Shipped</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-green-600 focus:text-green-600">
                            <CheckCircle2 className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-widest">Mark as Delivered</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-slate-100" />
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <ArrowRight className="h-4 w-4 text-slate-400" /> <span className="text-xs font-medium">Verify UPI Payment</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600">
                            <XCircle className="h-4 w-4" /> <span className="text-xs font-bold uppercase tracking-widest">Cancel Order</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Order Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto no-scrollbar">
          <SheetHeader className="pb-6 border-b">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
              <ClipboardList className="h-3 w-3" /> Boutique Admin
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">Order {selectedOrder?.id}</SheetTitle>
            <SheetDescription className="text-xs">Placed on {selectedOrder?.date}</SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-10">
            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Fulfillment</p>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold uppercase">{selectedOrder?.status}</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Payment</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold uppercase">{selectedOrder?.payment}</span>
                </div>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Customer Details</h3>
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <User className="h-5 w-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold leading-none">{selectedOrder?.customer}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedOrder?.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedOrder?.address}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Order Summary</h3>
              <div className="space-y-4">
                {selectedOrder?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-headline truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">Quantity: {item.qty}</p>
                    </div>
                    <p className="text-sm font-bold">₹{item.price.toLocaleString()}</p>
                  </div>
                ))}
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder?.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Shipping</span>
                    <span>₹{selectedOrder?.shipping?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-primary pt-2">
                    <span>Total Paid</span>
                    <span>₹{selectedOrder?.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Verification */}
            {selectedOrder?.payment === 'Verification Pending' && (
              <div className="space-y-4 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700">Payment Verification Required</h3>
                <p className="text-xs text-purple-600 leading-relaxed italic">
                  "Customer has uploaded a screenshot. Please verify the amount in your UPI bank statement before confirming."
                </p>
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden shadow-md border-4 border-white">
                  <Image src={selectedOrder?.paymentScreenshot} alt="UPI Screenshot" fill className="object-cover" />
                </div>
                <Button onClick={handleVerifyPayment} className="w-full bg-purple-600 hover:bg-purple-700 font-bold uppercase text-[10px] tracking-widest h-12">
                  Confirm UPI Verification
                </Button>
              </div>
            )}
          </div>

          <SheetFooter className="pt-6 border-t mt-auto flex-col sm:flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button onClick={() => handleUpdateStatus('Shipped')} variant="outline" className="rounded-xl font-bold uppercase text-[9px] tracking-widest gap-2">
                <Truck className="h-3 w-3" /> Mark Shipped
              </Button>
              <Button onClick={() => handleUpdateStatus('Delivered')} variant="outline" className="rounded-xl font-bold uppercase text-[9px] tracking-widest gap-2">
                <CheckCircle2 className="h-3 w-3" /> Mark Delivered
              </Button>
            </div>
            <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-bold uppercase text-[9px] tracking-widest">
              Cancel Order
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
