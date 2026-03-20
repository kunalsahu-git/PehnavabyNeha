'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp, ShoppingBag, IndianRupee, BarChart2,
  Loader2, AlertTriangle, Package, CheckCircle2,
  Clock, RefreshCw, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { getAllOrdersQuery, type OrderData } from '@/firebase/firestore/orders';
import { getAllProductsQuery, type ProductData } from '@/firebase/firestore/products';
import type { WithId } from '@/firebase';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

type DateRange = '7d' | '30d' | '90d' | 'all';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(ts: any): Date {
  if (!ts) return new Date(0);
  if (ts.toDate) return ts.toDate();
  return new Date(ts);
}

function filterByRange(orders: WithId<OrderData>[], range: DateRange): WithId<OrderData>[] {
  if (range === 'all') return orders;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = startOfDay(subDays(new Date(), days));
  return orders.filter(o => isAfter(toDate(o.createdAt), cutoff));
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// ── Chart colours ─────────────────────────────────────────────────────────────

const PRIMARY = 'hsl(var(--primary))';
const STATUS_COLORS: Record<string, string> = {
  PENDING:    '#f59e0b',
  PROCESSING: '#8b5cf6',
  SHIPPED:    '#3b82f6',
  DELIVERED:  '#10b981',
  CANCELLED:  '#94a3b8',
};

// ── Custom Tooltip ────────────────────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-3 text-xs">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="font-headline font-bold text-primary text-base">{formatINR(payload[0]?.value ?? 0)}</p>
    </div>
  );
};

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-3 text-xs">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="font-bold text-slate-800">{payload[0]?.value} orders</p>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function SalesAnalyticsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [range, setRange] = useState<DateRange>('30d');

  // Queries
  const ordersQuery = useMemoFirebase(
    () => db && user ? getAllOrdersQuery(db) : null,
    [db, user],
  );
  const productsQuery = useMemoFirebase(
    () => db && user ? getAllProductsQuery(db) : null,
    [db, user],
  );

  const { data: ordersRaw, isLoading: isLoadingOrders } = useCollection(ordersQuery);
  const { data: productsRaw, isLoading: isLoadingProducts } = useCollection(productsQuery);

  const isLoading = isLoadingOrders || isLoadingProducts;

  const allOrders   = ordersRaw   ?? [];
  const allProducts = productsRaw ?? [];

  // Filter orders by selected date range
  const orders = useMemo(() => filterByRange(allOrders, range), [allOrders, range]);

  // ── KPI calculations ────────────────────────────────────────────────────────

  const confirmedOrders = useMemo(
    () => orders.filter(o => o.paymentStatus === 'CONFIRMED'),
    [orders],
  );

  const totalRevenue = useMemo(
    () => confirmedOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    [confirmedOrders],
  );

  const totalOrders  = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / confirmedOrders.length || 0) : 0;
  const conversionRate = totalOrders > 0
    ? Math.round((confirmedOrders.length / totalOrders) * 100)
    : 0;

  // ── Daily revenue chart data ────────────────────────────────────────────────

  const revenueChartData = useMemo(() => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 90;
    const buckets: Record<string, number> = {};

    if (range === 'all') {
      // Group by month for all-time view
      confirmedOrders.forEach(o => {
        const d = toDate(o.createdAt);
        const key = format(d, 'MMM yy');
        buckets[key] = (buckets[key] ?? 0) + (o.total ?? 0);
      });
      return Object.entries(buckets)
        .sort(([a], [b]) => new Date('01 ' + a).getTime() - new Date('01 ' + b).getTime())
        .map(([date, revenue]) => ({ date, revenue }));
    }

    // Initialise all days in range
    for (let i = days - 1; i >= 0; i--) {
      const key = format(subDays(new Date(), i), 'dd MMM');
      buckets[key] = 0;
    }

    confirmedOrders.forEach(o => {
      const key = format(toDate(o.createdAt), 'dd MMM');
      if (key in buckets) buckets[key] += o.total ?? 0;
    });

    return Object.entries(buckets).map(([date, revenue]) => ({ date, revenue }));
  }, [confirmedOrders, range]);

  // ── Order status distribution ───────────────────────────────────────────────

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0,
    };
    orders.forEach(o => { if (o.orderStatus in counts) counts[o.orderStatus]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // ── Top moving items ────────────────────────────────────────────────────────

  const topItems = useMemo(() => {
    const map: Record<string, { name: string; units: number; revenue: number }> = {};
    orders.forEach(o => {
      (o.items ?? []).forEach((item: any) => {
        const key = item.productId ?? item.productName ?? item.name ?? 'Unknown';
        const name = item.productName ?? item.name ?? key;
        const qty  = item.quantity ?? 1;
        const rev  = (item.price ?? 0) * qty;
        if (!map[key]) map[key] = { name, units: 0, revenue: 0 };
        map[key].units   += qty;
        map[key].revenue += rev;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.units - a.units)
      .slice(0, 10);
  }, [orders]);

  // ── Payment status breakdown ────────────────────────────────────────────────

  const paymentBreakdown = useMemo(() => {
    const stats = {
      CONFIRMED:            { count: 0, amount: 0 },
      VERIFICATION_PENDING: { count: 0, amount: 0 },
      REFUNDED:             { count: 0, amount: 0 },
      PENDING:              { count: 0, amount: 0 },
    };
    orders.forEach(o => {
      const key = o.paymentStatus as keyof typeof stats;
      if (stats[key]) {
        stats[key].count++;
        stats[key].amount += o.total ?? 0;
      }
    });
    return stats;
  }, [orders]);

  // ── Low stock products ──────────────────────────────────────────────────────

  const lowStockProducts = useMemo(
    () => allProducts.filter(p => typeof p.stock === 'number' && p.stock <= 5),
    [allProducts],
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Loading analytics…
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">
            Sales Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Revenue, orders &amp; product insights.
          </p>
        </div>

        {/* Date Range Tabs */}
        <Tabs value={range} onValueChange={v => setRange(v as DateRange)}>
          <TabsList className="rounded-2xl bg-slate-100 h-11 p-1">
            {(['7d', '30d', '90d', 'all'] as DateRange[]).map(r => (
              <TabsTrigger
                key={r}
                value={r}
                className="rounded-xl text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary px-4"
              >
                {r === 'all' ? 'All Time' : `Last ${r.replace('d', ' Days')}`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Revenue',
            value: formatINR(totalRevenue),
            sub: `${confirmedOrders.length} paid orders`,
            icon: IndianRupee,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Total Orders',
            value: totalOrders.toString(),
            sub: `In selected period`,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Avg Order Value',
            value: formatINR(avgOrderValue),
            sub: 'Per confirmed order',
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Conversion Rate',
            value: `${conversionRate}%`,
            sub: 'Confirmed vs total',
            icon: BarChart2,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-headline font-bold">{stat.value}</h3>
                <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Revenue Chart ── */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Over Time
          </CardTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            {range === 'all' ? 'Monthly breakdown' : `Daily revenue — last ${range.replace('d', ' days')}`}
          </p>
        </CardHeader>
        <CardContent className="p-8 pt-6">
          {revenueChartData.length === 0 || revenueChartData.every(d => d.revenue === 0) ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <TrendingUp className="h-8 w-8 text-slate-200" />
              <p className="text-sm font-bold text-slate-400">No revenue data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={PRIMARY}
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: PRIMARY, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Order Status + Payment Breakdown row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Order Status Distribution */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Status
            </CardTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              Distribution by fulfilment stage
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-6">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 gap-3">
                <Package className="h-8 w-8 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">No orders in this period</p>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#cbd5e1'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="w-full space-y-2">
                  {statusData.map(({ name, value }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ background: STATUS_COLORS[name] ?? '#cbd5e1' }}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{name}</span>
                      </div>
                      <span className="text-sm font-headline font-bold text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Breakdown */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Payment Breakdown
            </CardTitle>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              By payment status &amp; amount
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-6 space-y-4">
            {[
              {
                key: 'CONFIRMED',
                label: 'Confirmed',
                icon: CheckCircle2,
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-100',
              },
              {
                key: 'VERIFICATION_PENDING',
                label: 'Pending Verification',
                icon: Clock,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-100',
              },
              {
                key: 'REFUNDED',
                label: 'Refunded',
                icon: RefreshCw,
                color: 'text-red-500',
                bg: 'bg-red-50',
                border: 'border-red-100',
              },
              {
                key: 'PENDING',
                label: 'Pending',
                icon: XCircle,
                color: 'text-slate-500',
                bg: 'bg-slate-50',
                border: 'border-slate-100',
              },
            ].map(({ key, label, icon: Icon, color, bg, border }) => {
              const stat = paymentBreakdown[key as keyof typeof paymentBreakdown];
              return (
                <div key={key} className={cn('flex items-center justify-between p-4 rounded-2xl border', bg, border)}>
                  <div className="flex items-center gap-3">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center bg-white/70')}>
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                      <p className="text-xs font-bold text-slate-700">{stat.count} orders</p>
                    </div>
                  </div>
                  <p className={cn('text-base font-headline font-bold', color)}>
                    {formatINR(stat.amount)}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Moving Items ── */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-lg font-headline font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Top Moving Items
          </CardTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Top 10 products by units sold
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {topItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Package className="h-8 w-8 text-slate-200" />
              <p className="text-sm font-bold text-slate-400">No item data in this period</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-50">
              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">#</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Units</TableHead>
                      <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topItems.map((item, i) => (
                      <TableRow key={item.name + i} className="hover:bg-slate-50/50 border-slate-50">
                        <TableCell className="px-8 text-[10px] font-black text-slate-300 w-10">
                          {String(i + 1).padStart(2, '0')}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-slate-700 line-clamp-1">{item.name}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="rounded-full bg-primary/10 text-primary border-none text-[10px] font-bold">
                            {item.units}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 text-right font-bold text-primary text-xs">
                          {formatINR(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Bar Chart */}
              <div className="p-8">
                <ResponsiveContainer width="100%" height={topItems.length * 36 + 20}>
                  <BarChart
                    data={topItems}
                    layout="vertical"
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    barSize={12}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={100}
                      tickFormatter={v => v.length > 14 ? v.slice(0, 13) + '…' : v}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(124,31,60,0.04)' }}
                      contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', fontSize: 11 }}
                      formatter={(value: number) => [`${value} units`, 'Sold']}
                    />
                    <Bar dataKey="units" radius={[0, 6, 6, 0]}>
                      {topItems.map((_, index) => (
                        <Cell
                          key={index}
                          fill={index === 0 ? PRIMARY : `hsl(var(--primary) / ${Math.max(0.2, 1 - index * 0.08)})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Low Stock Alert Panel ── */}
      <Card className={cn(
        'border-none shadow-sm rounded-3xl overflow-hidden',
        lowStockProducts.length > 0 ? 'ring-2 ring-red-200' : '',
      )}>
        <CardHeader className={cn(
          'p-8 border-b',
          lowStockProducts.length > 0 ? 'border-red-50 bg-red-50/60' : 'border-slate-50',
        )}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              'text-lg font-headline font-bold uppercase tracking-widest flex items-center gap-2',
              lowStockProducts.length > 0 ? 'text-red-600' : 'text-primary',
            )}>
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alerts
            </CardTitle>
            {lowStockProducts.length > 0 && (
              <Badge className="rounded-full bg-red-100 text-red-600 border-none text-[10px] font-bold uppercase tracking-widest px-3">
                {lowStockProducts.length} products
              </Badge>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Products with stock ≤ 5 units
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-300" />
              <p className="text-sm font-bold text-slate-400">All products are well stocked</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-red-50/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Product</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SKU</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map(product => (
                  <TableRow key={product.id} className="hover:bg-red-50/20 border-slate-50">
                    <TableCell className="px-8">
                      <div className="flex items-center gap-3">
                        {product.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-9 w-9 rounded-xl object-cover flex-shrink-0 bg-slate-100"
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{product.name}</p>
                          <p className="text-[10px] text-muted-foreground">{product.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-mono text-slate-400">{product.sku ?? '—'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-slate-100 text-slate-500 border-none text-[10px] font-bold">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-primary">{formatINR(product.price)}</span>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <Badge className={cn(
                        'rounded-full border-none text-[10px] font-black',
                        product.stock === 0
                          ? 'bg-red-100 text-red-600'
                          : product.stock! <= 2
                            ? 'bg-red-50 text-red-500'
                            : 'bg-amber-50 text-amber-600',
                      )}>
                        {product.stock === 0 ? 'OUT OF STOCK' : `${product.stock} left`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
