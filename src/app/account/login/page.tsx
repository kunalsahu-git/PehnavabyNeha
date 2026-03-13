'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageSquare, 
  ShieldCheck, 
  Loader2, 
  FastForward, 
  LogOut,
  Mail,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { initiateAnonymousSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'login' | 'complete-profile'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Watch for logged in user to check profile status in Firestore
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: userProfile, isLoading: isCheckingProfile } = useDoc(userProfileRef);

  useEffect(() => {
    if (user && !isCheckingProfile) {
      // Check if user is anonymous (Dev Bypass)
      if (user.isAnonymous) {
        router.push('/admin');
        return;
      }

      // Check if real user has a phone number in Firestore
      if (userProfile && userProfile.phone) {
        router.push('/');
      } else {
        // New user or missing phone - prompt to complete profile
        setStep('complete-profile');
        if (user.displayName && !name) setName(user.displayName);
      }
    }
  }, [user, userProfile, isCheckingProfile, router, name]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      setIsLoading(false);
      let message = "Google Sign-In was restricted or cancelled.";
      
      if (error.code === 'auth/unauthorized-domain') {
        message = "This domain is not authorized. Please add it to your Firebase Console 'Authorized domains'.";
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message
      });
    }
  };

  const handleDirectLogin = async () => {
    setIsLoading(true);
    try {
      await initiateAnonymousSignIn(auth);
      // The useEffect will handle the redirect to /admin
    } catch (error: any) {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Login Restricted",
        description: "Check Firebase Console settings for Anonymous Auth."
      });
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (phone.length < 10) {
      toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a 10-digit number." });
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        name: name || user.displayName || 'Boutique Member',
        email: user.email || '',
        phone: `+91${phone}`,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: "Profile Completed", description: "Welcome to Pehnava by Neha!" });
      router.push('/');
    } catch (error) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Save Failed", description: "Could not update your profile." });
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setStep('login');
      toast({ title: "Signed Out", description: "Your session has been cleared." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading || (user && isCheckingProfile)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Verifying Boutique Session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-50">
        
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="mb-6 group">
             <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-primary">
               <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Boutique
             </Button>
          </Link>
          <h1 className="text-3xl font-headline font-bold uppercase tracking-wider">
            {step === 'login' ? "Welcome" : "One Last Step"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-[280px]">
            {step === 'login' 
              ? "Join our curated luxury fashion community." 
              : "Please link your WhatsApp number for order updates."}
          </p>
        </div>

        {step === 'login' ? (
          <div className="space-y-6">
            <Button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-14 rounded-xl bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-[0.1em] shadow-sm flex items-center justify-center gap-3 transition-all"
            >
              <Image src="https://picsum.photos/seed/google/32/32" alt="Google" width={20} height={20} className="rounded-full" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-muted-foreground">Admin Testing</span></div>
            </div>

            <Button 
              onClick={handleDirectLogin}
              variant="outline"
              disabled={isLoading}
              className="w-full h-14 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary font-bold text-xs uppercase tracking-[0.2em] transition-all"
            >
              Skip OTP & Enter Admin Panel <FastForward className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCompleteProfile} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Neha Sharma"
                  className="h-12 rounded-xl border-slate-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r pr-3">+91</span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    className="pl-16 h-12 rounded-xl border-slate-200 text-lg font-bold tracking-widest"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || phone.length < 10}
              className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg transition-all"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete My Profile"}
            </Button>

            <Button 
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-muted-foreground text-[10px] font-bold uppercase tracking-widest"
            >
              Cancel & Sign Out
            </Button>
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
