'use client';

import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface UPIPaymentProps {
  amount: number;
  merchantName: string;
  upiId: string;
  orderId?: string;
  className?: string;
}

export function UPIPayment({ amount, merchantName, upiId, orderId = 'Order', className = '' }: UPIPaymentProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Construct URL with dynamic settings and descriptive transaction note
  const upiUrl = `upi://pay?cu=INR&pa=${upiId}&pn=${encodeURIComponent(merchantName)}&tn=${encodeURIComponent(`Payment for Order ${orderId} at Pehnava by Neha`)}&am=${amount.toFixed(2)}`;

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Pehnava_Payment_${orderId}.png`;
      link.href = url;
      link.click();
    }
  };

  const paymentApps = [
    { name: 'Google Pay', src: '/images/payment/google-pay.png' },
    { name: 'PhonePe', src: '/images/payment/phone-pe.png' },
    { name: 'Paytm', src: '/images/payment/paytm.png' },
    { name: 'Amazon Pay', src: '/images/payment/amazon-pay.png' },
  ];

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Authentic QR Frame */}
      <div className="w-full max-w-[340px] bg-white rounded-[32px] overflow-hidden border-[10px] border-[#d8e8f6] shadow-xl relative group">
        {/* Header: BHIM | UPI */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-center border-b border-slate-50">
          <div className="relative h-12 w-48">
            <Image 
              src="/images/payment/Bhim-Upi-Logo.png" 
              alt="BHIM UPI" 
              fill 
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Paying To Section */}
        <div className="p-6 text-center space-y-1">
          <div className="text-[10px] font-bold text-[#7f8c8d] uppercase tracking-[0.2em] mb-1">Paying to</div>
          <h4 className="text-[#2c3e50] font-bold text-lg">
            {merchantName}
          </h4>
          <p className="text-[#7f8c8d] text-[11px] font-bold tracking-wider font-mono bg-slate-50 py-1 px-3 rounded-full inline-block">
            {upiId}
          </p>
          <div className="pt-2 text-[#2c3e50] font-extrabold text-2xl tracking-tight">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* QR Code */}
        <div className="px-10 pb-6 flex justify-center">
          <div ref={qrRef} className="p-3 bg-white rounded-2xl border-2 border-slate-50 shadow-inner">
            <QRCodeCanvas 
              value={upiUrl}
              size={180}
              level="H"
              includeMargin={false}
              fgColor="#1a1a1a"
            />
          </div>
        </div>

        {/* Footer: Pay with any app */}
        <div className="bg-[#f8fbfe] p-6 text-center space-y-4">
          <p className="text-[#7f8c8d] text-[10px] font-bold uppercase tracking-widest">
            Pay with any UPI Payment App
          </p>
          <div className="flex justify-center gap-4">
            {paymentApps.map((app) => (
              <div key={app.name} className="h-10 w-10 bg-white rounded-full p-1 shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                <div className="relative h-full w-full">
                  <Image src={app.src} alt={app.name} fill className="object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Download Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px] pointer-events-none group-hover:pointer-events-auto">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={downloadQR}
            className="rounded-full gap-2 font-bold text-[10px] uppercase tracking-widest shadow-lg"
          >
            <Download className="h-3.5 w-3.5" />
            Download QR
          </Button>
        </div>
      </div>

      {/* Pay Now Button (Always Visible) */}
      <Button 
        asChild 
        className="w-full max-w-[340px] h-14 rounded-full bg-[#1a1a1a] hover:bg-black text-white font-bold uppercase text-xs tracking-[0.2em] shadow-xl group border-b-4 border-slate-800"
      >
        <a href={upiUrl}>
          <Smartphone className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
          Pay Now via UPI App
        </a>
      </Button>

      <div className="flex items-center gap-2 opacity-60">
        <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Verified Secure Payment</span>
      </div>
    </div>
  );
}
