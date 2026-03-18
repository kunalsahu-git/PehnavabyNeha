'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag, IndianRupee, TrendingUp, Package,
  Clock, CheckCircle2, AlertCircle, Loader2,
  ArrowRight, PackageCheck, Truck, Sparkles,
  LayoutGrid, Tag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { getAllOrdersQuery, type OrderData } from '@/firebase/firestore/orders';
import { getAllProductsQuery } from '@/firebase/firestore/products';
import { getAllCategoriesQuery } from '@/firebase/firestore/categories';
import { getAllCollectionsQuery } from '@/firebase/firestore/collections';

const statusBadge = (s: OrderData['orderStatus']) => cn(
  "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none",
  s === 'DELIVERED'  ? "bg-green-100 text-green-700" :
  s === 'SHIPPED'    ? "bg-blue-100 text-blue-700" :
  s === 'PROCESSING' ? "bg-purple-100 text-purple-700" :
  s === 'CANCELLED'  ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-700"
);

function formatDate(ts: any) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function AdminDashboard() {
  const db = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(() => (db && user) ? getAllOrdersQuery(db) : null, [db, user]);
  const productsQuery = useMemoFirebase(() => (db && user) ? getAllProductsQuery(db) : null, [db, user]);
  const categoriesQuery = useMemoFirebase(() => db ? getAllCategoriesQuery(db) : null, [db]);
  const collectionsQuery = useMemoFirebase(() => db ? getAllCollectionsQuery(db) : null, [db]);

  const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery);
  const { data: products, isLoading: isLoadingProducts } = useCollection(productsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: collections } = useCollection(collectionsQuery);

  const allOrders = orders ?? [];
  const allProducts = products ?? [];

  // Computed stats
  const confirmedRevenue = allOrders
    .filter(o => o.paymentStatus === 'CONFIRMED' || o.paymentStatus === 'VERIFICATION_PENDING')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingVerification = allOrders.filter(o => o.paymentStatus === 'VERIFICATION_PENDING').length;
  const pendingShipment = allOrders.filter(o => o.orderStatus === 'PENDING' && o.paymentStatus === 'CONFIRMED').length;
  const processingCount = allOrders.filter(o => o.orderStatus === 'PROCESSING').length;
  const liveProducts = allProducts.filter(p => p.published).length;
  const avgOrderValue = allOrders.length
    ? Math.round(allOrders.reduce((s, o) => s + o.total, 0) / allOrders.length)
    : 0;

  const isLoading = isLoadingOrders || isLoadingProducts;

  const STATS = [
    {
      label: 'Confirmed Revenue',
      value: `₹${confirmedRevenue.toLocaleString()}`,
      sub: `${allOrders.filter(o => o.paymentStatus === 'CONFIRMED').length} paid orders`,
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/admin/orders',
    },
    {
      label: 'Total Orders',
      value: allOrders.length.toString(),
      sub: `Avg ₹${avgOrderValue.toLocaleString()} per order`,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/admin/orders',
    },
    {
      label: 'Live Products',
      value: liveProducts.toString(),
      sub: `${allProducts.length - liveProducts} drafts`,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/admin/products',
    },
    {
      label: 'Pending Verification',
      value: pendingVerification.toString(),
      sub: pendingVerification > 0 ? 'UPI payments awaiting review' : 'All payments reviewed',
      icon: AlertCircle,
      color: pendingVerification > 0 ? 'text-amber-600' : 'text-slate-400',
      bg: pendingVerification > 0 ? 'bg-amber-50' : 'bg-slate-50',
      href: '/admin/orders',
      urgent: pendingVerification > 0,
    },
  ];

  const recentOrders = allOrders.slice(0, 6);

  const ALERTS = [
    {
      icon: AlertCircle,
      label: 'Awaiting UPI Verification',
      count: pendingVerification,
      color: 'text-amber-400',
      urgent: pendingVerification > 0,
    },
    {
      icon: Clock,
      label: 'Being Processed',
      count: processingCount,
      color: 'text-purple-400',
      urgent: false,
    },
    {
      icon: PackageCheck,
      label: 'Ready to Ship',
      count: pendingShipment,
      color: 'text-blue-400',
      urgent: pendingShipment > 0,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Overview</h1>
          <p className="text-sm text-muted-foreground">Your boutique at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-full font-bold uppercase text-[10px] tracking-widest px-6 border-slate-200 h-11">
            <Link href="/admin/orders">View All Orders</Link>
          </Button>
          <Button asChild className="rounded-full font-bold uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-primary/20 h-11">
            <Link href="/admin/products">Add Product</Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-36 animate-pulse bg-slate-100 rounded-3xl border-none" />
            ))
          : STATS.map(stat => (
              <Link key={stat.label} href={stat.href}>
                <Card className={cn(
                  "border-none shadow-sm rounded-3xl overflow-hidden group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
                  stat.urgent && "ring-2 ring-amber-400/40"
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                        <stat.icon className={cn("h-5 w-5", stat.color)} />
                      </div>
                      {stat.urgent && (
                        <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-full uppercase tracking-widest">
                          Action needed
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      <h3 className="text-3xl font-headline font-bold">{stat.value}</h3>
                      <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
        }
      </div>

      {/* Catalog quick-stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: allProducts.length, icon: Package, href: '/admin/products' },
          { label: 'Categories', value: (categories ?? []).length, icon: Tag, href: '/admin/categories' },
          { label: 'Collections', value: (collections ?? []).length, icon: LayoutGrid, href: '/admin/collections' },
          { label: 'Delivered Orders', value: allOrders.filter(o => o.orderStatus === 'DELIVERED').length, icon: CheckCircle2, href: '/admin/orders' },
        ].map(item => (
          <Link key={item.label} href={item.href}>
            <Card className="border-none shadow-sm rounded-2xl bg-white hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <item.icon className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</p>
                  <p className="text-xl font-headline font-bold text-slate-900">{isLoading ? '—' : item.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest text-primary">Recent Orders</CardTitle>
            <Button variant="link" asChild className="text-primary font-bold text-[10px] uppercase tracking-widest p-0 h-auto">
              <Link href="/admin/orders" className="flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-2">
                <ShoppingBag className="h-8 w-8 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">No orders yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map(order => (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 cursor-pointer transition-colors">
                      <TableCell className="px-8 font-bold text-slate-900 text-xs font-mono">{order.id.slice(0, 8)}…</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{order.name}</span>
                          <span className="text-[9px] text-muted-foreground">{formatDate(order.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadge(order.orderStatus)}>{order.orderStatus}</Badge>
                      </TableCell>
                      <TableCell className="px-8 text-right font-bold text-primary text-xs">₹{order.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Alerts */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-7 pb-4">
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Action Needed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-7 pt-0 space-y-3">
              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                </div>
              ) : ALERTS.map((item, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border",
                    item.urgent && item.count > 0
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{item.label}</span>
                  </div>
                  <span className={cn(
                    "text-sm font-black",
                    item.urgent && item.count > 0 ? "text-amber-400" : "text-white"
                  )}>
                    {item.count}
                  </span>
                </div>
              ))}
              <Button asChild className="w-full h-11 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-[10px] uppercase tracking-widest mt-2">
                <Link href="/admin/orders" className="flex items-center gap-2">
                  Manage Orders <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Shipping pipeline */}
          <Card className="border-none shadow-sm rounded-3xl bg-white">
            <CardHeader className="p-7 pb-4">
              <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest text-primary">Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="p-7 pt-0 space-y-3">
              {[
                { label: 'Pending', count: allOrders.filter(o => o.orderStatus === 'PENDING').length, color: 'bg-amber-500' },
                { label: 'Processing', count: processingCount, color: 'bg-purple-500' },
                { label: 'Shipped', count: allOrders.filter(o => o.orderStatus === 'SHIPPED').length, color: 'bg-blue-500' },
                { label: 'Delivered', count: allOrders.filter(o => o.orderStatus === 'DELIVERED').length, color: 'bg-green-500' },
              ].map(item => {
                const pct = allOrders.length ? Math.round((item.count / allOrders.length) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</span>
                      <span className="text-[10px] font-black text-slate-700">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", item.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
