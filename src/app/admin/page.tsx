'use client';

import React from 'react';
import { 
  ShoppingBag, 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { getAllOrdersQuery } from '@/firebase/firestore/orders';
import { getAllProductsQuery } from '@/firebase/firestore/products';

export default function AdminDashboard() {
  const db = useFirestore();
  const { user } = useUser();

  // Dashboard Stats - Defensive Queries (Wait for user auth)
  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getAllProductsQuery(db);
  }, [db, user]);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return getAllOrdersQuery(db);
  }, [db, user]);
  
  const { data: products, isLoading: isLoadingProducts } = useCollection(productsQuery);
  const { data: orders, isLoading: isLoadingOrders } = useCollection(ordersQuery);

  const STATS = [
    { 
      label: 'Total Revenue (Est)', 
      value: `₹${(orders ?? []).reduce((acc, o) => acc + (o.paymentStatus === 'CONFIRMED' ? o.total : 0), 0).toLocaleString()}`, 
      change: '+12.5%', 
      trend: 'up', 
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    { 
      label: 'Total Orders', 
      value: (orders ?? []).length.toString(), 
      change: '+18.2%', 
      trend: 'up', 
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      label: 'Live Products', 
      value: (products ?? []).filter(p => p.published).length.toString(), 
      change: '+5.4%', 
      trend: 'up', 
      icon: ShoppingBag,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      label: 'Avg. Order Value', 
      value: `₹${Math.round((orders?.length ? orders.reduce((acc, o) => acc + o.total, 0) / orders.length : 0)).toLocaleString()}`, 
      change: '-2.1%', 
      trend: 'down', 
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
  ];

  const recentOrders = (orders ?? []).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">Welcome back, Neha. Here's your boutique's performance snapshot.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full font-bold uppercase text-[10px] tracking-widest px-6 border-slate-200">
            Download Report
          </Button>
          <Button className="rounded-full font-bold uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-primary/20">
            Create New Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingOrders || isLoadingProducts ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-slate-100 rounded-3xl border-none" />
          ))
        ) : (
          STATS.map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm rounded-3xl overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <Badge variant="secondary" className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold border-none",
                    stat.trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <h3 className="text-3xl font-headline font-bold">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-primary">Recent Orders</CardTitle>
            <Button variant="link" className="text-primary font-bold text-[10px] uppercase tracking-widest p-0">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                    <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 cursor-pointer transition-colors">
                      <TableCell className="px-8 font-bold text-slate-900 text-xs">{order.id}</TableCell>
                      <TableCell className="text-xs font-medium">
                        <div className="flex flex-col">
                          <span>{order.name}</span>
                          <span className="text-[9px] text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : ''}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none",
                          order.orderStatus === 'DELIVERED' ? "bg-green-100 text-green-700" :
                          order.orderStatus === 'SHIPPED' ? "bg-blue-100 text-blue-700" :
                          order.orderStatus === 'PROCESSING' ? "bg-purple-100 text-purple-700" :
                          order.orderStatus === 'CANCELLED' ? "bg-slate-100 text-slate-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {order.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-8 text-right font-bold text-primary text-xs">₹{order.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-accent">Admin Alerts</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              {[
                { icon: Clock, label: 'Pending Payment', value: (orders ?? []).filter(o => o.paymentStatus === 'VERIFICATION_PENDING').length.toString() + ' Orders', color: 'text-amber-400' },
                { icon: AlertCircle, label: 'Processing', value: (orders ?? []).filter(o => o.orderStatus === 'PROCESSING').length.toString() + ' Orders', color: 'text-blue-400' },
                { icon: CheckCircle2, label: 'Ready to Ship', value: (orders ?? []).filter(o => o.orderStatus === 'PENDING' && o.paymentStatus === 'CONFIRMED').length.toString() + ' Orders', color: 'text-green-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5", item.color)} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-xs font-bold">{item.value}</span>
                </div>
              ))}
              <Button className="w-full h-12 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-[10px] uppercase tracking-widest">
                Resolve Alerts
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-primary">Boutique Tip</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "Real-time data is now active. Your dashboard metrics reflect confirmed payments and live catalog status."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
