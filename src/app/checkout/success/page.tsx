
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

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const displayId = orderId ? `Order #${orderId.slice(-6).toUpperCase()}` : `PN-${Math.floor(Math.random() * 90000) + 10000}`;
  
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
        className="max-w-2xl w-full bg-white rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.06)] border p-8 md:p-12 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500" />
        
        <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-50 mb-8 relative">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-headline font-bold uppercase tracking-tight mb-4">Order Received!</h1>
        
        <div className="flex items-center justify-center gap-2 mb-8">
           <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Payment Verification Pending</p>
        </div>

        <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto mb-10 leading-relaxed">
          Thank you for choosing Pehnava by Neha. Your payment receipt has been received. Our team will verify it and update your order status shortly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-left">
          <div className="bg-slate-50/50 p-6 rounded-[32px] space-y-2 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
              <Package className="h-3.5 w-3.5" /> Order Reference
            </div>
            <p className="text-xl font-bold font-headline text-slate-900 tracking-tighter">{displayId}</p>
          </div>
          <div className="bg-slate-50/50 p-6 rounded-[32px] space-y-2 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
              <Calendar className="h-3.5 w-3.5" /> Ordered Date
            </div>
            <p className="text-xl font-bold font-headline text-slate-900 tracking-tighter">{today}</p>
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

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
