'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MessageSquare, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number."
      });
      return;
    }

    setIsLoading(true);
    // Simulate API call to send WhatsApp OTP
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      toast({
        title: "OTP Sent!",
        description: "A 6-digit code has been sent to your WhatsApp number."
      });
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "Please enter the 6-digit code sent to your WhatsApp."
      });
      return;
    }

    setIsLoading(true);
    // Simulate OTP verification and login
    setTimeout(() => {
      initiateAnonymousSignIn(auth);
      toast({
        title: "Welcome Back!",
        description: "Successfully signed in with WhatsApp OTP."
      });
      // In a real app, we'd redirect here.
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-50">
        
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="mb-6 group">
             <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-primary">
               <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Boutique
             </Button>
          </Link>
          <h1 className="text-3xl font-headline font-bold uppercase tracking-wider">Welcome</h1>
          <p className="text-muted-foreground text-sm max-w-[280px]">
            {step === 'phone' 
              ? "Enter your WhatsApp number to receive an instant login code." 
              : "We've sent a 6-digit code to your WhatsApp. Please enter it below."}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r pr-3">+91</span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="98765 43210"
                  className="pl-16 h-14 rounded-xl border-slate-200 focus:ring-primary focus:border-primary text-lg font-bold tracking-widest"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || phone.length < 10}
              className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <div className="flex items-center gap-2">
                  Send OTP via WhatsApp <MessageSquare className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="otp" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification Code</Label>
                <button 
                  type="button" 
                  onClick={() => setStep('phone')} 
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                >
                  Change Number
                </button>
              </div>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="0 0 0 0 0 0"
                className="h-14 rounded-xl border-slate-200 text-center text-2xl font-bold tracking-[0.5em] focus:ring-primary focus:border-primary"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                autoFocus
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || otp.length !== 6}
              className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Sign In"}
            </Button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.1em]"
              >
                Didn't receive code? Resend in 30s
              </button>
            </div>
          </form>
        )}

        <div className="pt-8 border-t space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col items-center text-center space-y-1">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Secure Login</span>
             </div>
             <div className="flex flex-col items-center text-center space-y-1">
                <MessageSquare className="h-5 w-5 text-accent" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Fast Support</span>
             </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 leading-relaxed font-medium">
            By continuing, you agree to Pehnava by Neha's <br />
            <Link href="/policies/terms" className="underline hover:text-primary">Terms of Service</Link> & <Link href="/policies/privacy" className="underline hover:text-primary">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
