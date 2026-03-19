'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, Camera, ChevronRight, Info, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';

interface PaymentVerificationProps {
  orderId: string;
  userId: string;
  total: number;
  onComplete: () => void;
}

export function PaymentVerification({ orderId, userId, total, onComplete }: PaymentVerificationProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1: Guide, 2: Upload

  const db = useFirestore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please upload an image file (PNG/JPG).');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !orderId) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload to Cloudinary via our API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'pehnava/receipts');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { url: receiptUrl } = await uploadRes.json();

      // 2. Update Firestore Order
      const orderRef = doc(db, 'users', userId, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentScreenshotUrl: receiptUrl,
        paymentStatus: 'VERIFICATION_PENDING',
        updatedAt: new Date().toISOString()
      });

      onComplete();
    } catch (err: any) {
      console.error('Full Upload Error Object:', err);
      setError(`Upload failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-900">How to Verify Payment</h3>
          <p className="text-slate-500 text-sm italic">Follow these 3 simple steps to complete your order</p>
        </div>

        <div className="space-y-4">
          {[
            { 
              icon: <Smartphone className="h-5 w-5 text-blue-500" />, 
              title: "Pay via UPI", 
              desc: `Use the QR or "Pay Now" button to pay ₹${total.toFixed(2)}` 
            },
            { 
              icon: <Camera className="h-5 w-5 text-purple-500" />, 
              title: "Take Screenshot", 
              desc: "Capture the success screen showing transaction ID" 
            },
            { 
              icon: <Upload className="h-5 w-5 text-green-500" />, 
              title: "Upload & Finish", 
              desc: "Upload the screenshot here to confirm your order" 
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-start">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 text-sm underline decoration-slate-200 underline-offset-4">{item.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
          <Info className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-orange-800 font-bold leading-normal italic">
            Note: Your order will be processed only after we verify the uploaded transaction receipt.
          </p>
        </div>

        <Button 
          onClick={() => setStep(2)}
          className="w-full h-14 rounded-full bg-slate-900 hover:bg-black text-white font-bold uppercase text-xs tracking-[0.2em] shadow-xl group"
        >
          Got it, Let's Upload
          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-slate-900">Upload Transaction Receipt</h3>
        <p className="text-slate-500 text-sm">Select the success screenshot from your gallery</p>
      </div>

      <Card className="border-2 border-dashed border-slate-200 rounded-[32px] overflow-hidden bg-slate-50/50">
        <CardContent className="p-0">
          {preview ? (
            <div className="relative aspect-[4/5] w-full bg-black group">
              <Image src={preview} alt="Receipt Preview" fill className="object-contain" />
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-4 right-4 h-10 w-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              >
                <AlertCircle className="h-5 w-5 text-red-500 rotate-45" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-16 px-6 cursor-pointer hover:bg-slate-100/50 transition-colors gap-4">
              <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-slate-50">
                <Upload className="h-8 w-8 text-blue-500 animate-bounce" />
              </div>
              <div className="text-center space-y-1">
                <span className="block text-sm font-bold text-slate-900">Click to upload screenshot</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">PNG, JPG or JPEG</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-700 text-xs font-bold border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button 
          disabled={!file || isUploading}
          onClick={handleUpload}
          className="w-full h-14 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-50 group border-b-4 border-green-800"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
              Complete Order
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          disabled={isUploading}
          onClick={() => setStep(1)}
          className="w-full h-14 rounded-full border-2 border-slate-200 text-slate-600 font-bold uppercase text-xs tracking-[0.2em] hover:bg-slate-50"
        >
          Back to Guide
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 opacity-60">
        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">End-to-end encrypted upload</span>
      </div>
    </div>
  );
}
