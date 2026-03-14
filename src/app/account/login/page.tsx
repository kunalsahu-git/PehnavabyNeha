'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithCustomToken,
  RecaptchaVerifier,
  type ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  Mail,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { OTP_MODE, TEST_CREDENTIALS, getTestOtp } from '@/lib/otp-config';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthTab = 'email' | 'phone';
type EmailMode = 'signin' | 'signup';
type PhoneStep = 'input' | 'otp' | 'profile';

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // ── Tab state
  const [activeTab, setActiveTab] = useState<AuthTab>('email');

  // ── Email/Password state
  const [emailMode, setEmailMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // ── Phone OTP state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('input');
  const [phoneNumber, setPhoneNumber] = useState(''); // 10 digits, no +91
  const [otpValue, setOtpValue] = useState('');
  const [profileName, setProfileName] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [testOtpHint, setTestOtpHint] = useState<string | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(true);

  // ── Google state
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // ── reCAPTCHA ref (Firebase Phone Auth requires it)
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function startResendTimer(seconds = 60) {
    setResendTimer(seconds);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  /** Ensures a Firestore /users/{uid} document exists after any sign-in. */
  async function ensureUserDoc(uid: string, data: { name?: string; email?: string; phone?: string }) {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        id: uid,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        createdAt: serverTimestamp(),
      });
    }
  }

  async function getOrInitRecaptcha(): Promise<RecaptchaVerifier> {
    if (recaptchaRef.current) return recaptchaRef.current;
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    });
    await verifier.render();
    recaptchaRef.current = verifier;
    return verifier;
  }

  function clearRecaptcha() {
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
  }

  // ─── Email/Password Handler ───────────────────────────────────────────────

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsEmailLoading(true);

    try {
      if (emailMode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Welcome back!' });
        router.push('/');
      } else {
        if (signupPhone.length < 10) {
          toast({ variant: 'destructive', title: 'Invalid phone', description: 'Enter a 10-digit number.' });
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await ensureUserDoc(cred.user.uid, {
          name,
          email,
          phone: `+91${signupPhone}`,
        });
        toast({ title: 'Account created!', description: 'Welcome to Pehnava by Neha.' });
        router.push('/');
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const messages: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'Email already registered. Sign in instead.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-email': 'Enter a valid email address.',
        'auth/invalid-credential': 'Incorrect email or password.',
      };
      toast({
        variant: 'destructive',
        title: 'Error',
        description: messages[err.code ?? ''] || err.message || 'Something went wrong.',
      });
    } finally {
      setIsEmailLoading(false);
    }
  }

  // ─── Google Sign-In Handler ────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await ensureUserDoc(cred.user.uid, {
        name: cred.user.displayName || '',
        email: cred.user.email || '',
        phone: cred.user.phoneNumber || '',
      });
      toast({ title: 'Signed in with Google!' });
      router.push('/');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/popup-closed-by-user') return; // User cancelled, no toast needed
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: err.message || 'Try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  // ─── Phone OTP: Send OTP ─────────────────────────────────────────────────

  async function handleSendOtp() {
    if (phoneNumber.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid number', description: 'Enter a 10-digit mobile number.' });
      return;
    }

    const fullPhone = `+91${phoneNumber}`;
    setIsSendingOtp(true);

    try {
      if (OTP_MODE === 'whatsapp') {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to send OTP');
        }
        setPhoneStep('otp');
        startResendTimer();
        toast({ title: 'OTP sent via WhatsApp!' });
        return;
      }

      // test or firebase mode → Firebase Phone Auth
      const verifier = await getOrInitRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      confirmationRef.current = confirmation;

      const hint = OTP_MODE === 'test' ? getTestOtp(fullPhone) : null;
      setTestOtpHint(hint);
      setPhoneStep('otp');
      startResendTimer();

      if (OTP_MODE === 'test' && hint) {
        toast({ title: 'Test OTP ready', description: `Your OTP is: ${hint}` });
      } else {
        toast({ title: 'OTP sent!', description: `Sent to +91 ${phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2')}` });
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      clearRecaptcha();
      const messages: Record<string, string> = {
        'auth/invalid-phone-number': 'Invalid phone number format.',
        'auth/too-many-requests': 'Too many requests. Try again later.',
        'auth/captcha-check-failed': 'reCAPTCHA failed. Try again.',
      };
      toast({
        variant: 'destructive',
        title: 'Failed to send OTP',
        description: messages[err.code ?? ''] || err.message || 'Try again.',
      });
    } finally {
      setIsSendingOtp(false);
    }
  }

  // ─── Phone OTP: Verify OTP ────────────────────────────────────────────────

  async function handleVerifyOtp() {
    if (otpValue.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Enter the 6-digit OTP.' });
      return;
    }

    const fullPhone = `+91${phoneNumber}`;
    setIsVerifyingOtp(true);

    try {
      if (OTP_MODE === 'whatsapp') {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone, otp: otpValue }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');

        if (data.devMode) {
          toast({
            title: 'OTP Verified (Dev Mode)',
            description: 'Configure FIREBASE_ADMIN_* env vars to enable full sign-in.',
          });
          return;
        }

        const cred = await signInWithCustomToken(auth, data.customToken);
        await ensureUserDoc(cred.user.uid, { phone: fullPhone });
        await handlePostPhoneSignIn(cred.user.displayName, cred.user.uid, fullPhone);
        return;
      }

      // test / firebase mode
      if (!confirmationRef.current) {
        toast({ variant: 'destructive', title: 'Session expired', description: 'Resend OTP.' });
        setPhoneStep('input');
        return;
      }

      const cred = await confirmationRef.current.confirm(otpValue);
      await ensureUserDoc(cred.user.uid, { phone: fullPhone });
      await handlePostPhoneSignIn(cred.user.displayName, cred.user.uid, fullPhone);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const messages: Record<string, string> = {
        'auth/invalid-verification-code': 'Wrong OTP. Check and try again.',
        'auth/code-expired': 'OTP expired. Request a new one.',
      };
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: messages[err.code ?? ''] || err.message || 'Try again.',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handlePostPhoneSignIn(displayName: string | null, uid: string, phone: string) {
    if (!displayName) {
      // New user — collect name
      setPhoneStep('profile');
    } else {
      toast({ title: 'Welcome back!' });
      router.push('/');
    }
  }

  // ─── Phone OTP: Profile Setup (new user) ──────────────────────────────────

  async function handleProfileSave() {
    if (!profileName.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Enter your name to continue.' });
      return;
    }
    setIsProfileSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user session.');
      await updateProfile(user, { displayName: profileName.trim() });
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await setDoc(ref, { name: profileName.trim() }, { merge: true });
      } else {
        await setDoc(ref, {
          id: user.uid,
          name: profileName.trim(),
          email: user.email || '',
          phone: user.phoneNumber || `+91${phoneNumber}`,
          createdAt: serverTimestamp(),
        });
      }
      toast({ title: 'Welcome to Pehnava by Neha!' });
      router.push('/');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Try again.' });
    } finally {
      setIsProfileSaving(false);
    }
  }

  // ─── Resend OTP ───────────────────────────────────────────────────────────

  function handleResendOtp() {
    setOtpValue('');
    setTestOtpHint(null);
    setPhoneStep('input');
    clearRecaptcha();
    confirmationRef.current = null;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100 space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4" /> Back to Boutique
            </Button>
          </Link>
          <h1 className="text-3xl font-headline font-bold uppercase tracking-wider">
            {activeTab === 'email' && emailMode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {activeTab === 'phone'
              ? 'Sign in or sign up with your mobile number.'
              : emailMode === 'signin'
              ? 'Sign in to your Pehnava account.'
              : 'Join our curated luxury fashion community.'}
          </p>
        </div>

        {/* Test Mode Banner */}
        {OTP_MODE === 'test' && activeTab === 'phone' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTestPanel(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <FlaskConical className="h-3.5 w-3.5" />
                Test Mode Active — No SMS Sent
              </span>
              {showTestPanel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {showTestPanel && (
              <div className="px-4 pb-3 space-y-1.5 border-t border-amber-200">
                <p className="text-[10px] text-amber-700 mt-2 mb-1">
                  Register these in Firebase Console → Auth → Phone → Test phone numbers
                </p>
                {TEST_CREDENTIALS.map(cred => (
                  <button
                    key={cred.phone}
                    type="button"
                    onClick={() => setPhoneNumber(cred.phone.replace('+91', ''))}
                    className="w-full text-left rounded-lg bg-white border border-amber-200 px-3 py-2 hover:bg-amber-50 transition-colors"
                  >
                    <span className="text-xs font-mono text-slate-800 font-bold">
                      {cred.phone.replace('+91', '').replace(/(\d{5})(\d{5})/, '+91 $1 $2')}
                    </span>
                    <span className="text-[10px] text-amber-700 ml-2">OTP: <strong>{cred.otp}</strong></span>
                    <span className="text-[10px] text-slate-400 ml-2">({cred.label})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auth Tabs */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'email'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'phone'
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Phone className="h-3.5 w-3.5" /> Phone OTP
          </button>
        </div>

        {/* ── Email/Password Form ── */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {emailMode === 'signup' && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input
                  placeholder="Neha Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-slate-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {emailMode === 'signup' && (
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">WhatsApp Number</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r pr-3 text-sm">+91</span>
                  <Input
                    type="tel"
                    placeholder="98765 43210"
                    value={signupPhone}
                    onChange={e => setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    className="pl-16 h-12 rounded-xl border-slate-200 font-bold tracking-widest"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isEmailLoading}
              className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em] mt-2"
            >
              {isEmailLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        )}

        {/* ── Phone OTP Form ── */}
        {activeTab === 'phone' && (
          <div className="space-y-4">

            {/* Step 1: Phone Input */}
            {phoneStep === 'input' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r pr-3 text-sm">+91</span>
                    <Input
                      type="tel"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="pl-16 h-12 rounded-xl border-slate-200 font-bold tracking-widest"
                    />
                  </div>
                  {OTP_MODE === 'whatsapp' && (
                    <p className="text-[10px] text-slate-400 mt-1">OTP will be sent via WhatsApp</p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || phoneNumber.length !== 10}
                  className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em]"
                >
                  {isSendingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP'}
                </Button>
              </div>
            )}

            {/* Step 2: OTP Entry */}
            {phoneStep === 'otp' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-slate-700">
                    OTP sent to{' '}
                    <span className="font-bold">+91 {phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2')}</span>
                  </p>
                  {testOtpHint && OTP_MODE === 'test' && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                      Test OTP: <strong className="font-mono tracking-widest">{testOtpHint}</strong>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Enter 6-digit OTP
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="_ _ _ _ _ _"
                    maxLength={6}
                    value={otpValue}
                    onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-14 rounded-xl border-slate-200 font-mono text-2xl text-center tracking-[0.5em] font-bold"
                    autoFocus
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otpValue.length !== 6}
                  className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em]"
                >
                  {isVerifyingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Sign In'}
                </Button>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Change number / Resend'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Profile Setup (new user) */}
            {phoneStep === 'profile' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600">One last step — what should we call you?</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Your Name
                  </Label>
                  <Input
                    placeholder="Neha Sharma"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="h-12 rounded-xl border-slate-200"
                    autoFocus
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={isProfileSaving || !profileName.trim()}
                  className="w-full h-14 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-[0.2em]"
                >
                  {isProfileSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Setup'}
                </Button>
              </div>
            )}

            {/* Invisible reCAPTCHA container (required for Firebase Phone Auth) */}
            <div id="recaptcha-container" />
          </div>
        )}

        {/* ── Divider ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* ── Google Sign-In ── */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full h-12 rounded-xl border-slate-200 font-semibold text-sm gap-3 hover:bg-slate-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </Button>

        {/* ── Mode Toggle (Email tab only) ── */}
        {activeTab === 'email' && (
          <div className="text-center text-sm text-muted-foreground">
            {emailMode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => setEmailMode('signup')} className="font-bold text-primary hover:underline">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setEmailMode('signin')} className="font-bold text-primary hover:underline">
                  Sign In
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-[10px] text-center text-slate-400 leading-relaxed">
          By continuing, you agree to our{' '}
          <Link href="/policies/terms" className="underline hover:text-primary">Terms</Link>
          {' & '}
          <Link href="/policies/privacy" className="underline hover:text-primary">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
