
'use client';

import React, { useState } from 'react';
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
  ArrowRight
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
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MOCK_ORDERS = [
  { id: 'PN-82931', customer: 'Anjali Sharma', phone: '+91 98765 43210', date: '2024-01-15', total: 4999, status: 'Shipped', payment: 'Verified' },
  { id: 'PN-82930', customer: 'Priya Verma', phone: '+91 88888 77777', date: '2024-01-15', total: 2499, status: 'Processing', payment: 'Verification Pending' },
  { id: 'PN-82929', customer: 'Mehak Gill', phone: '+91 77777 66666', date: '2024-01-14', total: 8200, status: 'Delivered', payment: 'Verified' },
  { id: 'PN-82928', customer: 'Sneha Gupta', phone: '+91 99999 88888', date: '2024-01-14', total: 1299, status: 'Pending', payment: 'Unpaid' },
  { id: 'PN-82927', customer: 'Ritu Singh', phone: '+91 66666 55555', date: '2024-01-12', total: 5400, status: 'Cancelled', payment: 'Refunded' },
  { id: 'PN-82926', customer: 'Pooja Bhatia', phone: '+91 90000 11111', date: '2024-01-10', total: 3499, status: 'Delivered', payment: 'Verified' },
];

export default function OrdersAdminPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Order Management</h1>
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
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all group/btn">
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
    </div>
  );
}
