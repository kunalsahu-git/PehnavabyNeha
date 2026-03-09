
'use client';

import { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

// Mock data for order history
const MOCK_ORDERS = [
  {
    id: 'PN-82931',
    date: 'Jan 15, 2024',
    status: 'Delivered',
    total: 4999,
    items: [
      { name: 'Crimson Embroidered Silk Saree', image: 'https://picsum.photos/seed/crimson-saree/200/200', quantity: 1 }
    ],
    tracking: 'TRACK9921029',
    courier: 'BlueDart'
  },
  {
    id: 'PN-77210',
    date: 'Dec 20, 2023',
    status: 'Shipped',
    total: 3499,
    items: [
      { name: 'Gold Floral Motif Kurta Set', image: 'https://picsum.photos/seed/gold-kurta/200/200', quantity: 1 }
    ],
    tracking: 'TRACK8812003',
    courier: 'Delhivery'
  },
  {
    id: 'PN-66102',
    date: 'Nov 02, 2023',
    status: 'Payment Pending',
    total: 1299,
    items: [
      { name: 'Kundan Pearl Jhumkas', image: 'https://picsum.photos/seed/jewelry/200/200', quantity: 1 }
    ]
  }
];

export default function OrdersPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('all');

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
              <Input placeholder="Search orders..." className="pl-10 h-11 rounded-full bg-white border-slate-200" />
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-8" onValueChange={setActiveTab}>
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

            <TabsContent value={activeTab} className="space-y-6 mt-0">
              {MOCK_ORDERS.length > 0 ? (
                MOCK_ORDERS.map((order) => (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                    {/* Order Top Bar */}
                    <div className="bg-slate-50/50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Order ID</p>
                          <p className="text-sm font-bold font-headline">{order.id}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Date Placed</p>
                          <p className="text-sm font-medium">{order.date}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Total Amount</p>
                          <p className="text-sm font-bold text-primary">₹{order.total.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={cn(
                          "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                          order.status === 'Delivered' ? "bg-green-100 text-green-700 border-none" : 
                          order.status === 'Shipped' ? "bg-blue-100 text-blue-700 border-none" : 
                          "bg-amber-100 text-amber-700 border-none"
                        )}>
                          {order.status}
                        </Badge>
                        <Button variant="ghost" size="sm" className="rounded-full h-8 px-4 text-[10px] font-bold uppercase tracking-widest border">
                          View Invoice
                        </Button>
                      </div>
                    </div>

                    {/* Order Body */}
                    <div className="p-6 flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-6">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="relative h-20 w-16 rounded-xl overflow-hidden bg-secondary/20 flex-shrink-0 border">
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="text-sm font-bold font-headline leading-snug">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                              <div className="flex items-center gap-2 pt-1">
                                <Button variant="link" className="h-auto p-0 text-primary text-[10px] font-bold uppercase tracking-widest">Buy Again</Button>
                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                <Button variant="link" className="h-auto p-0 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Review Product</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline / Tracking Mini Section */}
                      <div className="md:w-72 bg-slate-50/30 rounded-2xl p-5 border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <Truck className="h-3 w-3 text-primary" /> Delivery Details
                          </h5>
                          {order.tracking && (
                            <Link href="#" className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1">
                              Track <ExternalLink className="h-2 w-2" />
                            </Link>
                          )}
                        </div>
                        
                        {order.tracking ? (
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-white">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                </div>
                                <div className="w-0.5 h-6 bg-green-500/20" />
                                <div className="h-4 w-4 rounded-full bg-slate-200" />
                              </div>
                              <div className="space-y-1 flex-1">
                                <p className="text-[11px] font-bold leading-none">Dispatched</p>
                                <p className="text-[9px] text-muted-foreground">Via {order.courier} • {order.tracking}</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed italic bg-white p-2 rounded-lg border border-slate-100">
                              Estimated Delivery by Wednesday
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 py-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <p className="text-[11px] font-medium text-amber-700">Verification in progress</p>
                          </div>
                        )}
                        
                        <Button className="w-full rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest bg-slate-900 hover:bg-black">
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
                    <p className="text-muted-foreground text-sm">Your boutique journey starts with your first piece.</p>
                  </div>
                  <Button asChild className="rounded-full px-10 h-12 font-bold uppercase text-[10px] tracking-widest">
                    <Link href="/collections/all">Explore Collections</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
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
    </div>
  );
}
