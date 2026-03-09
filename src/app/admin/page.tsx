'use client';

import React from 'react';
import { 
  ShoppingBag, 
  Users, 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
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

const STATS = [
  { 
    label: 'Total Revenue', 
    value: '₹1,24,500', 
    change: '+12.5%', 
    trend: 'up', 
    icon: IndianRupee,
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  { 
    label: 'Total Orders', 
    value: '482', 
    change: '+18.2%', 
    trend: 'up', 
    icon: ShoppingBag,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  { 
    label: 'Active Customers', 
    value: '1,205', 
    change: '+5.4%', 
    trend: 'up', 
    icon: Users,
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  { 
    label: 'Avg. Order Value', 
    value: '₹3,450', 
    change: '-2.1%', 
    trend: 'down', 
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
];

const RECENT_ORDERS = [
  { id: 'PN-82931', customer: 'Anjali Sharma', items: 2, total: 4999, status: 'Shipped', date: '2 mins ago' },
  { id: 'PN-82930', customer: 'Priya Verma', items: 1, total: 2499, status: 'Processing', date: '15 mins ago' },
  { id: 'PN-82929', customer: 'Mehak Gill', items: 3, total: 8200, status: 'Delivered', date: '1 hour ago' },
  { id: 'PN-82928', customer: 'Sneha Gupta', items: 1, total: 1299, status: 'Payment Pending', date: '3 hours ago' },
  { id: 'PN-82927', customer: 'Ritu Singh', items: 2, total: 5400, status: 'Cancelled', date: 'Yesterday' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, Neha. Here's what's happening at the boutique today.</p>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat) => (
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Recent Orders</CardTitle>
            <Button variant="link" className="text-primary font-bold text-[10px] uppercase tracking-widest p-0">View All Orders</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Order ID</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Customer</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Items</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_ORDERS.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50/50 border-slate-50 cursor-pointer transition-colors">
                    <TableCell className="px-8 font-bold text-slate-900 text-xs">{order.id}</TableCell>
                    <TableCell className="text-xs font-medium">
                      <div className="flex flex-col">
                        <span>{order.customer}</span>
                        <span className="text-[9px] text-muted-foreground">{order.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-500">{order.items}</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none",
                        order.status === 'Delivered' ? "bg-green-100 text-green-700" :
                        order.status === 'Shipped' ? "bg-blue-100 text-blue-700" :
                        order.status === 'Processing' ? "bg-purple-100 text-purple-700" :
                        order.status === 'Cancelled' ? "bg-slate-100 text-slate-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 text-right font-bold text-primary text-xs">₹{order.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Actions / Notifications */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-accent">Admin Alerts</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              {[
                { icon: Clock, label: 'Pending Verification', value: '12 Orders', color: 'text-amber-400' },
                { icon: AlertCircle, label: 'Out of Stock', value: '4 Products', color: 'text-red-400' },
                { icon: CheckCircle2, label: 'Ready to Ship', value: '8 Orders', color: 'text-green-400' },
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

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Boutique Tip</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "Your 'Festive Wedding Edit' collection is performing 20% better than last month. Consider featuring more Ivory and Gold pieces on the homepage."
              </p>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
}
