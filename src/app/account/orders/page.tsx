
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ExternalLink,
  ArrowLeft,
  Search,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { MapPin, CreditCard, ClipboardList } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import { getUserOrdersQuery, getOrderItemsQuery, OrderData, OrderItemData } from '@/firebase/firestore/orders';
import { getBoutiqueSettings, BoutiqueSettings } from '@/firebase/firestore/settings';
import { generateInvoicePDF } from '@/lib/invoice-generator';
import { getTrackingUrl } from '@/lib/tracking-utils';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';

function OrderItem({ item }: { item: OrderItemData }) {
  return (
    <div className="flex gap-4">
      <div className="relative h-20 w-16 rounded-xl overflow-hidden bg-secondary/20 flex-shrink-0 border">
        <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-bold font-headline leading-snug">{item.productName}</h4>
        <p className="text-xs text-muted-foreground">
          Quantity: {item.quantity} 
          {item.size && <span className="ml-2">• Size: {item.size}</span>}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <Link href={`/products/${item.slug}`}>
            <Button variant="link" className="h-auto p-0 text-primary text-[10px] font-bold uppercase tracking-widest">Buy Again</Button>
          </Link>
          <span className="h-1 w-1 rounded-full bg-slate-200" />
          <Link href={`/products/${item.slug}#reviews`}>
            <Button variant="link" className="h-auto p-0 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Review Product</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderItemsList({ userId, orderId, fallbackItems }: { userId: string, orderId: string, fallbackItems?: any[] }) {
  const db = useFirestore();
  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return getOrderItemsQuery(db, userId, orderId);
  }, [db, userId, orderId]);

  const { data: subItems, isLoading } = useCollection<OrderItemData>(itemsQuery);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Fetching items...</span>
      </div>
    );
  }

  // Use subcollection items if available, else fallback to the items array on the order doc
  const items = (subItems && subItems.length > 0) ? subItems : fallbackItems;

  if (!items || items.length === 0) {
    return <p className="text-xs text-muted-foreground py-4 italic">No items details found.</p>;
  }

  return (
    <div className="space-y-6">
      {items.map((item: any, idx) => (
        <OrderItem key={idx} item={{
          productId: item.productId || item.id,
          productName: item.productName || item.name,
          productImage: item.productImage || item.image,
          slug: item.slug || item.id,
          price: item.price,
          quantity: item.quantity,
          size: item.size
        }} />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WithId<OrderData> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [boutiqueSettings, setBoutiqueSettings] = useState<BoutiqueSettings | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Fetch boutique settings for invoice branding
  useEffect(() => {
    if (db) {
      getBoutiqueSettings(db).then(setBoutiqueSettings);
    }
  }, [db]);

  const handleDownloadInvoice = async (order: WithId<OrderData>) => {
    if (!db || !user) return;
    setIsGeneratingInvoice(true);
    try {
      // Fetch full items list for the invoice
      const itemsSnap = await getDocs(getOrderItemsQuery(db, user.uid, order.id));
      const items = itemsSnap.docs.map(d => d.data() as OrderItemData);
      
      // Fallback to order.items if subcollection is empty
      const finalItems = items.length > 0 ? items : (order.items || []);
      
      await generateInvoicePDF(order, finalItems as OrderItemData[], boutiqueSettings);
    } catch (error) {
      console.error('Invoice generation failed:', error);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const parseAddress = (json: string | undefined) => {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
  };

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return getUserOrdersQuery(db, user.uid);
  }, [db, user?.uid]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<OrderData>(ordersQuery);

  const filteredOrders = orders?.map(order => {
    // Normalize status into orderStatus if missing
    const orderStatus = (order.orderStatus || (order as any).status || 'PENDING').toUpperCase() as OrderData['orderStatus'];
    const paymentStatus = (order.paymentStatus || (order as any).paymentStatus || 'PENDING').toUpperCase() as OrderData['paymentStatus'];
    return { ...order, orderStatus, paymentStatus };
  }).filter(order => {
    // Tab Filter
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'ongoing' && ['PENDING', 'PROCESSING', 'SHIPPED'].includes(order.orderStatus)) ||
      (activeTab === 'delivered' && order.orderStatus === 'DELIVERED') ||
      (activeTab === 'cancelled' && order.orderStatus === 'CANCELLED');
    
    // Search Filter
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderStatus.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  }) || [];

  if (isUserLoading || isOrdersLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-secondary/10 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-2">
              <Link href="/account/profile" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="mr-2 h-3 w-3" /> Back to Profile
              </Link>
              <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">My Orders</h1>
              <p className="text-muted-foreground text-sm">Track, manage and view your boutique purchase history.</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search orders..." 
                className="pl-10 h-11 rounded-full bg-white border-slate-200" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeTab} className="space-y-8" onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 gap-8">
              {['all', 'ongoing', 'delivered', 'cancelled'].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab}
                  className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary px-0 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {['all', 'ongoing', 'delivered', 'cancelled'].map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="space-y-6 mt-0">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    {/* Order Top Bar */}
                    <div className="bg-slate-50/50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Order ID</p>
                          <p className="text-sm font-bold font-headline">{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date Placed</p>
                          <p className="text-sm font-medium">
                            {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM dd, yyyy') : 'Recently'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total Amount</p>
                          <p className="text-sm font-bold text-primary">₹{order.total.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                          order.orderStatus === 'DELIVERED' ? "bg-green-100 text-green-700 border-none" : 
                          order.orderStatus === 'SHIPPED' ? "bg-blue-100 text-blue-700 border-none" : 
                          order.orderStatus === 'CANCELLED' ? "bg-red-100 text-red-700 border-none" :
                          "bg-amber-100 text-amber-700 border-none"
                        )}>
                          {order.orderStatus}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-full h-8 px-4 text-[10px] font-bold uppercase tracking-widest border"
                          onClick={() => {
                            setSelectedOrder(order as WithId<OrderData>);
                            setIsDetailOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>

                    {/* Order Body */}
                    <div className="p-6 flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-6">
                        <OrderItemsList userId={user!.uid} orderId={order.id} fallbackItems={order.items} />
                      </div>

                      {/* Timeline / Tracking Mini Section */}
                      <div className="md:w-72 bg-slate-50/30 rounded-2xl p-5 border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                             <Truck className="h-3 w-3 text-primary" /> {order.orderStatus === 'SHIPPED' ? 'In Transit' : 'Order Status'}
                          </h5>
                          {order.trackingNumber && (
                            <Link 
                              href={getTrackingUrl(order.courierName, order.trackingNumber)} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              Track <ExternalLink className="h-2 w-2" />
                            </Link>
                          )}
                        </div>
                        
                        {order.trackingNumber ? (
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  "h-4 w-4 rounded-full flex items-center justify-center text-white",
                                  order.orderStatus === 'DELIVERED' ? "bg-green-500" : "bg-blue-500"
                                )}>
                                  {order.orderStatus === 'DELIVERED' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />}
                                </div>
                                <div className="w-0.5 h-6 bg-slate-200" />
                                <div className="h-4 w-4 rounded-full bg-slate-100" />
                              </div>
                              <div className="space-y-1 flex-1">
                                <p className="text-[11px] font-bold leading-none">{order.orderStatus}</p>
                                <p className="text-[9px] text-muted-foreground">{order.courierName} • {order.trackingNumber}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 py-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <p className="text-[11px] font-medium text-amber-700">
                              {order.orderStatus === 'PENDING' ? 'Awaiting Payment' : 'Processing order'}
                            </p>
                          </div>
                        )}
                        
                        <Button variant="outline" className="w-full rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-slate-200">
                          Need Help?
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="py-24 text-center space-y-6 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="h-20 w-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                      <Package className="h-10 w-10 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-headline font-bold">No orders found</h3>
                      <p className="text-muted-foreground text-sm">
                        {activeTab === 'all' 
                          ? 'Your boutique journey starts with your first piece.' 
                          : `No ${activeTab} orders at the moment.`}
                      </p>
                    </div>
                    <Button asChild className="rounded-full px-10 h-12 font-bold uppercase text-[10px] tracking-widest">
                      <Link href="/shop">Explore Collections</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Boutique Note */}
          <div className="mt-20 p-8 bg-accent/5 rounded-3xl border border-accent/10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="h-16 w-16 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
              <MessageSquare className="h-8 w-8 text-accent" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-headline font-bold text-accent">Questions about your order?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our support team is available via WhatsApp from 10 AM to 8 PM IST. 
                We usually respond within 15 minutes during boutique hours.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 rounded-full border-accent text-accent hover:bg-accent hover:text-white font-bold h-12 px-8 uppercase text-[10px] tracking-widest transition-all">
              <Link href="https://wa.me/918888888888">Chat with Neha</Link>
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto no-scrollbar">
          {selectedOrder && (
            <>
              <SheetHeader className="pb-6 border-b relative">
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-[0.3em]">
                  <ClipboardList className="h-3 w-3" /> Order Details
                </div>
                <SheetTitle className="text-2xl font-headline font-bold uppercase font-mono">{selectedOrder.id}</SheetTitle>
                <SheetDescription className="text-xs">
                  Placed {selectedOrder.createdAt?.seconds ? format(new Date(selectedOrder.createdAt.seconds * 1000), 'MMM dd, yyyy HH:mm') : 'Recently'}
                </SheetDescription>
                
                {/* Download Button in Header */}
                <div className="absolute right-6 top-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    disabled={isGeneratingInvoice}
                    onClick={() => handleDownloadInvoice(selectedOrder)}
                  >
                    {isGeneratingInvoice ? (
                      <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Generating...</>
                    ) : (
                      'Download Invoice'
                    )}
                  </Button>
                </div>
              </SheetHeader>

              <div className="py-8 space-y-8">
                {/* Status Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Fulfillment</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        selectedOrder.orderStatus === 'DELIVERED' ? "bg-green-500" : 
                        selectedOrder.orderStatus === 'SHIPPED' ? "bg-blue-500" : 
                        "bg-amber-500"
                      )} />
                      <span className="text-sm font-bold uppercase">{selectedOrder.orderStatus}</span>
                      {selectedOrder.trackingNumber && (
                        <Link 
                          href={getTrackingUrl(selectedOrder.courierName, selectedOrder.trackingNumber)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="link" className="h-auto p-0 text-[10px] font-bold uppercase tracking-widest text-primary ml-2">
                             Track <ExternalLink className="h-2 w-2 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-primary/10">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Payment</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold uppercase">{selectedOrder.paymentStatus.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Shipping Address</h3>
                  <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      {(() => {
                        const addr = parseAddress(selectedOrder.addressJson);
                        return addr ? (
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            <p className="font-bold text-slate-900 mb-1">{addr.name}</p>
                            <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                            <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                            <p className="mt-2 text-[10px] font-bold">Phone: {addr.phone}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Address details unavailable.</p>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Items Ordered</h3>
                  <OrderItemsList userId={user!.uid} orderId={selectedOrder.id} fallbackItems={selectedOrder.items} />
                </div>

                {/* Billing Summary */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Billing Summary</h3>
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
                      <span>Total Paid</span>
                      <span>₹{selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Help Section */}
                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 text-center space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest">Need help with this order?</h4>
                  <p className="text-xs text-muted-foreground">If you have any issues with your delivery or the products received, please contact us.</p>
                  <Button asChild variant="outline" className="w-full rounded-full border-primary text-primary hover:bg-primary hover:text-white font-bold h-11 uppercase text-[10px] tracking-widest">
                    <Link href={`https://wa.me/918888888888?text=I need help with my order ${selectedOrder.id}`}>
                      Contact Boutique Support
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
