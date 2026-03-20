
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  Loader2,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type PhoneStep = 'input' | 'otp';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [needsPhoneCapture, setNeedsPhoneCapture] = useState(false);
  const [signupPhone, setSignupPhone] = useState('');
  const [isCapturingPhone, setIsCapturingPhone] = useState(false);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (user && !user.isAnonymous && !needsPhoneCapture) {
      checkUserPhone(user.uid);
    }
  }, [user]);

  async function checkUserPhone(uid: string) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!(snap.exists() && snap.data().phone)) {
        setNeedsPhoneCapture(true);
      }
    } catch (e) {
      console.error('Error checking phone:', e);
    }
  }

  async function ensureUserDoc(uid: string, data: { name?: string; email?: string; phone?: string }) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    const payload = {
      id: uid,
      name: data.name || snap.data()?.name || '',
      email: data.email || snap.data()?.email || '',
      phone: data.phone || snap.data()?.phone || '',
      updatedAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, payload, { merge: true });
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setUnauthorizedDomain(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await checkUserPhone(cred.user.uid);
      toast({ title: 'Signed in with Google!' });
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(window.location.hostname);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function handlePhoneCaptureSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || signupPhone.length !== 10) return;
    setIsCapturingPhone(true);
    try {
      await ensureUserDoc(user.uid, {
        name: user.displayName || '',
        email: user.email || '',
        phone: `+91${signupPhone}`,
      });
      setNeedsPhoneCapture(false);
      toast({ title: 'Profile Completed', description: 'Your WhatsApp number is now linked.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
    } finally {
      setIsCapturingPhone(false);
    }
  }

  async function handleSendOtp() {
    if (phoneNumber.length !== 10) return;
    const fullPhone = `+91${phoneNumber}`;
    setIsSendingOtp(true);
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current);
      confirmationRef.current = confirmation;
      setPhoneStep('otp');
      toast({ title: 'OTP sent!', description: `Verification code sent to +91 ${phoneNumber}` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Could not send OTP', description: error.message });
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpValue.length !== 6 || !confirmationRef.current) return;
    setIsVerifyingOtp(true);
    try {
      const cred = await confirmationRef.current.confirm(otpValue);
      await ensureUserDoc(cred.user.uid, { phone: `+91${phoneNumber}` });
      router.push('/');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Verification Failed', description: error.message });
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  if (needsPhoneCapture) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-slate-100 space-y-8 text-center">
          <div className="space-y-3">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-headline font-bold uppercase tracking-wider">One Last Step</h1>
            <p className="text-muted-foreground text-sm">To provide a premium boutique experience, we need your WhatsApp number for order updates.</p>
          </div>
          <form onSubmit={handlePhoneCaptureSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r pr-3 text-sm">+91</span>
                <Input
                  type="tel"
                  placeholder="98765 43210"
                  value={signupPhone}
                  onChange={e => setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="pl-16 h-14 rounded-xl border-slate-200 font-bold tracking-widest text-lg"
                />
              </div>
            </div>
            <Button type="submit" disabled={isCapturingPhone || signupPhone.length !== 10} className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em]">
              {isCapturingPhone ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Boutique Profile'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/"><Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="h-4 w-4" /> Back to Boutique</Button></Link>
          <h1 className="text-3xl font-headline font-bold uppercase tracking-wider">{user ? 'Account Dashboard' : 'Sign In'}</h1>
          <p className="text-muted-foreground text-sm">Access your curated luxury fashion community.</p>
        </div>

        {unauthorizedDomain && (
          <Alert variant="destructive" className="rounded-2xl border-red-100 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-xs font-bold uppercase tracking-widest">Unauthorized Domain</AlertTitle>
            <AlertDescription className="space-y-3 pt-2">
              <p className="text-xs">The current domain is not whitelisted in Firebase Authentication.</p>
              <div className="bg-white p-2 rounded-lg border border-red-100 font-mono text-[10px] break-all select-all">{unauthorizedDomain}</div>
            </AlertDescription>
          </Alert>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-secondary/20 border border-primary/10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-headline text-2xl font-bold">
                {user.displayName?.[0] || user.email?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.displayName || user.email || 'Boutique Member'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Verified Profile</p>
              </div>
            </div>
            <Button asChild className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black font-bold uppercase text-[10px] tracking-widest gap-2">
              <Link href="/account/profile">My Account <ChevronRight className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" onClick={() => auth.signOut()} className="w-full text-muted-foreground hover:text-red-500 text-[10px] font-bold uppercase tracking-widest">
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Button onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="w-full h-14 rounded-xl bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-900 font-bold text-sm gap-3 shadow-sm">
              {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )} Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">or use phone</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="space-y-4">
              {phoneStep === 'input' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r pr-3 text-sm">+91</span>
                    <Input type="tel" placeholder="98765 43210" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} className="pl-16 h-12 rounded-xl" />
                  </div>
                  <Button onClick={handleSendOtp} disabled={isSendingOtp || phoneNumber.length !== 10} variant="outline" className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest">
                    {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Verification OTP'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-center text-muted-foreground">OTP sent to <span className="font-bold text-foreground">+91 {phoneNumber}</span></p>
                  <Input type="text" inputMode="numeric" placeholder="Enter 6-digit OTP" maxLength={6} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))} className="h-14 rounded-xl text-center tracking-[0.5em] font-bold text-xl" />
                  <Button onClick={handleVerifyOtp} disabled={isVerifyingOtp || otpValue.length !== 6} className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest">
                    {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Log In'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setPhoneStep('input'); setOtpValue(''); }} className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <RotateCcw className="h-3 w-3 mr-2" /> Change Number
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div id="recaptcha-container" />
        <p className="text-[10px] text-center text-slate-400 leading-relaxed">
          By continuing, you agree to our <Link href="/policies/terms" className="underline hover:text-primary">Terms</Link> & <Link href="/policies/privacy" className="underline hover:text-primary">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
