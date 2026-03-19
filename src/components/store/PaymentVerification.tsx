'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, Camera, ChevronRight, Info, Smartphone, HelpCircle, X, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PaymentVerificationProps {
  orderId: string;
  userId: string;
  total: number;
  onComplete: () => void;
}

const steps = [
  {
    icon: <Smartphone className="h-4 w-4" />,
    title: 'Pay via UPI',
    desc: 'Scan QR or tap "Pay Now"',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: <Camera className="h-4 w-4" />,
    title: 'Take Screenshot',
    desc: 'Capture the success screen',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    icon: <Upload className="h-4 w-4" />,
    title: 'Upload & Finish',
    desc: 'Confirm your order',
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-100',
  },
];

const screenshotGuide = [
  {
    device: 'iPhone',
    icon: '🍎',
    steps: [
      'Open your UPI app (PhonePe / GPay / Paytm)',
      'Complete the payment',
      'On the success screen, press Side Button + Volume Up simultaneously',
      'Screenshot saves to your Photos app',
    ],
  },
  {
    device: 'Android',
    icon: '🤖',
    steps: [
      'Open your UPI app (PhonePe / GPay / Paytm)',
      'Complete the payment',
      'On the success screen, press Power + Volume Down simultaneously',
      'Or swipe your palm across the screen (Samsung)',
      'Screenshot saves to your Gallery app',
    ],
  },
];

export function PaymentVerification({ orderId, userId, total, onComplete }: PaymentVerificationProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 0 = guide, 1 = upload
  const [currentStep, setCurrentStep] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);

  const db = useFirestore();

  // Steps 0 = Pay (always done), 1 = Screenshot, 2 = Upload
  // currentStep 0 means user is at "Take Screenshot" step (Pay is done)
  // currentStep 1 means user is at "Upload" step
  const completedCount = currentStep === 0 ? 1 : 2; // how many tracker steps are ticked

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

      const orderRef = doc(db, 'users', userId, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentScreenshotUrl: receiptUrl,
        paymentStatus: 'VERIFICATION_PENDING',
        updatedAt: new Date().toISOString(),
      });

      onComplete();
    } catch (err: any) {
      console.error('Full Upload Error Object:', err);
      setError(`Upload failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-md mx-auto">

      {/* ── Progress Tracker ── */}
      <div className="relative flex items-start justify-between">
        {/* connecting line */}
        <div className="absolute top-5 left-0 right-0 h-px bg-slate-100 z-0 mx-10" />

        {steps.map((s, i) => {
          const isDone = i < completedCount;
          const isActive = i === completedCount;
          const isPending = i > completedCount;

          return (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2 flex-1">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isDone && "bg-green-500 border-green-500 text-white shadow-md shadow-green-200",
                isActive && "bg-white border-primary text-primary shadow-md shadow-primary/20",
                isPending && "bg-white border-slate-200 text-slate-300"
              )}>
                {isDone
                  ? <CheckCircle2 className="h-5 w-5" />
                  : isActive
                    ? <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" /><span className="relative inline-flex rounded-full h-3 w-3 bg-primary" /></span>
                    : <span className="text-[10px] font-bold">{i + 1}</span>
                }
              </div>
              <div className="text-center space-y-0.5">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter leading-tight",
                  isDone && "text-green-600",
                  isActive && "text-primary",
                  isPending && "text-slate-300"
                )}>
                  {s.title}
                </p>
                <p className={cn(
                  "text-[9px] hidden sm:block leading-tight",
                  isDone && "text-green-500",
                  isActive && "text-slate-500",
                  isPending && "text-slate-300"
                )}>
                  {isDone ? "Done" : s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Step Content ── */}
      {currentStep === 0 ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-center space-y-1 pb-2">
            <h3 className="text-lg font-bold text-slate-900">Ready to take your screenshot?</h3>
            <p className="text-slate-400 text-xs">Make sure your UPI success screen is visible</p>
          </div>

          {/* Step cards */}
          <div className="space-y-3">
            {/* Step 1 – done */}
            <div className="flex gap-3 p-4 rounded-2xl bg-green-50 border border-green-100 items-center">
              <div className="h-9 w-9 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-green-700 text-sm">Pay via UPI</h4>
                <p className="text-xs text-green-600 font-medium">₹{total.toFixed(2)} — Payment initiated</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-green-600 bg-green-100 px-2 py-1 rounded-full">Done</span>
            </div>

            {/* Step 2 – active */}
            <div className="flex gap-3 p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 items-center shadow-sm">
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border-2 border-purple-300">
                <Camera className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-purple-800 text-sm">Take Screenshot</h4>
                <p className="text-xs text-purple-500 font-medium">Capture the UPI success screen</p>
              </div>
              <button
                onClick={() => setGuideOpen(true)}
                className="shrink-0 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-100 hover:bg-purple-200 px-2 py-1.5 rounded-full transition-colors"
              >
                <HelpCircle className="h-3 w-3" />
                Guide
              </button>
            </div>

            {/* Step 3 – pending */}
            <div className="flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-center opacity-50">
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <Upload className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-400 text-sm">Upload & Finish</h4>
                <p className="text-xs text-slate-400 font-medium">Confirm your order</p>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Next</span>
            </div>
          </div>

          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
            <Info className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-orange-700 font-bold leading-relaxed italic">
              Your order will be processed only after we verify the uploaded transaction receipt.
            </p>
          </div>

          <Button
            onClick={() => setCurrentStep(1)}
            className="w-full h-14 rounded-full bg-slate-900 hover:bg-black text-white font-bold uppercase text-xs tracking-[0.2em] shadow-xl group"
          >
            I've Got My Screenshot
            <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Upload Your Receipt</h3>
            <p className="text-slate-400 text-xs">Select the success screenshot from your gallery</p>
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
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center py-16 px-6 cursor-pointer hover:bg-slate-100/50 transition-colors gap-4">
                  <div className="h-20 w-20 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-slate-50">
                    <Upload className="h-8 w-8 text-blue-500 animate-bounce" />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="block text-sm font-bold text-slate-900">Click to upload screenshot</span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNG, JPG or JPEG</span>
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
                <><Loader2 className="mr-3 h-5 w-5 animate-spin" />Uploading...</>
              ) : (
                <><CheckCircle2 className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />Complete Order</>
              )}
            </Button>
            <Button
              variant="outline"
              disabled={isUploading}
              onClick={() => setCurrentStep(0)}
              className="w-full h-12 rounded-full border-2 border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50"
            >
              Back
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 opacity-50">
            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">End-to-end encrypted upload</span>
          </div>
        </div>
      )}

      {/* ── Screenshot Guide Modal ── */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-headline uppercase tracking-wider flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-500" />
              How to Screenshot
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {screenshotGuide.map((guide) => (
              <div key={guide.device} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{guide.icon}</span>
                  <h4 className="font-black text-sm uppercase tracking-widest text-slate-800">{guide.device}</h4>
                </div>
                <ol className="space-y-2 ml-1">
                  {guide.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
              <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                Make sure the transaction ID and amount are clearly visible in the screenshot.
              </p>
            </div>

            <Button
              onClick={() => setGuideOpen(false)}
              className="w-full h-11 rounded-full font-bold uppercase text-[10px] tracking-widest"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
