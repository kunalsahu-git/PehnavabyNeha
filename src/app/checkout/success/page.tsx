
'use client';

import Link from 'next/link';
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Calendar, 
  Package, 
  MessageSquare,
  Instagram
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function OrderSuccessPage() {
  // Generate a random order number
  const orderNumber = `PN-${Math.floor(Math.random() * 90000) + 10000}`;
  const today = new Date().toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-secondary/10 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border p-8 md:p-12 text-center"
      >
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-8">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>

        <h1 className="text-3xl md:text-5xl font-headline font-bold uppercase tracking-tight mb-4">Order Received!</h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-10">
          Thank you for choosing Pehnava by Neha. Your order has been placed and is currently under verification.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Package className="h-3.5 w-3.5" /> Order ID
            </div>
            <p className="text-xl font-bold font-headline">{orderNumber}</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 border border-slate-100">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Order Date
            </div>
            <p className="text-xl font-bold font-headline">{today}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button asChild className="w-full sm:w-auto rounded-full px-10 h-14 font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg">
              <Link href="/account/orders">Track Your Order</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-full px-10 h-14 font-bold uppercase text-[10px] tracking-[0.2em] border-primary text-primary">
              <Link href="/">Continue Shopping <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="pt-10 border-t flex flex-col items-center gap-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Join our community</p>
            <div className="flex gap-6">
              <Link href="#" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-4 w-4" /> Instagram
              </Link>
              <Link href="#" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                <MessageSquare className="h-4 w-4" /> WhatsApp Support
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
