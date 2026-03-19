
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  ChevronRight,
  Upload,
  Loader2,
  CheckCircle2,
  Lock,
  Plus,
  Info,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, type WithId } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getUserProfile, getUserAddressesQuery, saveUserAddress, UserAddress } from '@/firebase/firestore/users';
import { UPIPayment } from '@/components/store/UPIPayment';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PaymentVerification } from '@/components/store/PaymentVerification';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { validateCoupon, CouponData, RewardType } from '@/firebase/firestore/coupons';
import { Star, Tag as TagIcon, Percent, Sparkles, X, XCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch Boutique Settings for Payment Details
  const settingsRef = useMemoFirebase(() => doc(db, 'configs', 'settings'), [db]);
  const settingsDoc = useDoc<any>(settingsRef);
  const settings = settingsDoc.data;
  const merchantName = settings?.displayName || 'PehnavaByNeha';
  const upiId = settings?.upiId || 'Q544369675@ybl';

  const [step, setStep] = useState<'shipping' | 'payment' | 'verification'>('shipping');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    pincode: '',
    label: 'Home'
  });
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string, code: string, discount: number, description: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<WithId<CouponData>[]>([]);

  // Fetch Profile for Autofill
  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // Fetch Saved Addresses
  const addressesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return getUserAddressesQuery(db, user.uid);
  }, [db, user?.uid]);
  const { data: savedAddresses, isLoading: isAddressesLoading } = useCollection<UserAddress>(addressesQuery);

  // Autofill logic
  useEffect(() => {
    if (user && !address.name && !address.phone) {
      setAddress(prev => ({
        ...prev,
        name: profile?.name || user.displayName || '',
        phone: profile?.phone || user.phoneNumber || ''
      }));
    }
  }, [user, profile, address.name, address.phone]);

  // Fetch Available Coupons for Suggestions
  useEffect(() => {
    async function fetchCoupons() {
      if (!db) return;
      const q = query(collection(db, 'coupons'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WithId<CouponData>));
      setAvailableCoupons(docs);
    }
    fetchCoupons();
  }, [db]);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const codeToUse = codeOverride || couponCode;
    if (!codeToUse || !db || !user) return;
    
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      // For validation, we need to provide category/collection IDs for each item
      // Assuming item has categoryId/collectionId or we might need to fetch them
      const itemsWithMeta = items.map(item => ({
        ...item,
        productId: item.id,
        // Fallbacks if not present in cart context
        categoryId: (item as any).categoryId || '', 
        collectionId: (item as any).collectionId || ''
      }));

      const result = await validateCoupon(db, codeToUse, user.uid, itemsWithMeta, subtotal);
      
      if (result.valid) {
        setAppliedCoupon({
          id: result.couponId!,
          code: result.couponCode!,
          discount: result.discount!,
          description: result.description!
        });
        setCouponCode('');
        toast({ title: 'Coupon Applied!', description: `You saved ₹${result.discount?.toLocaleString()}` });
      } else {
        setCouponError(result.reason || 'Invalid coupon.');
      }
    } catch (err) {
      setCouponError('System error validating coupon.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({ title: 'Coupon Removed' });
  };

  const deliveryCharge = subtotal > 2999 ? 0 : 99;
  const discountAmount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal + deliveryCharge - discountAmount);

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to place an order.",
        variant: "destructive"
      });
      router.push('/account/login');
      return;
    }

    // Save address if requested or if it's a new one not already in savedAddresses
    if (saveForFuture && db && user) {
      try {
        await saveUserAddress(db, user.uid, address);
      } catch (err) {
        console.error("Failed to save address:", err);
      }
    }

    setStep('payment');
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    if (!user || items.length === 0) return;
    
    setIsProcessing(true);
    try {
      // 1. Create the order in Firestore
      const orderData = {
        userId: user.uid,
        name: address.name,
        phone: address.phone,
        addressJson: JSON.stringify(address),
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          image: item.image
        })),
        subtotal,
        deliveryCharge,
        total,
        discount: discountAmount,
        couponCode: appliedCoupon?.code || null,
        couponId: appliedCoupon?.id || null,
        orderStatus: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'UPI',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'orders'), orderData);
      
      // 1.1 Save items to subcollection for orders page & admin dashboard
      await Promise.all(items.map(item => 
        addDoc(collection(db, 'users', user.uid, 'orders', docRef.id, 'items'), {
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          slug: item.id, // Assuming slug is same as ID or use a real slug if available
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color || '',
          createdAt: serverTimestamp()
        })
      ));

      setCreatedOrderId(docRef.id);
      
      // 2. Move to verification step
      setStep('verification');
      window.scrollTo(0, 0);
      
      toast({
        title: "Order Initialized",
        description: "Please upload your payment receipt to complete the order.",
      });
    } catch (err) {
      console.error("Order Creation Error:", err);
      toast({
        title: "Error",
        description: "Failed to initialize order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerificationComplete = () => {
    clearCart();
    router.push(`/checkout/success?orderId=${createdOrderId}`);
    toast({
      title: "Payment Submitted!",
      description: "We're verifying your payment. Your order is now confirmed.",
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
        <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-headline font-bold">Your bag is empty</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">Add some beautiful pieces to your bag before checking out.</p>
        </div>
        <Button asChild className="rounded-full px-8">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-secondary/10 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
              <Link href="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary mb-2">
                <ArrowLeft className="mr-2 h-3 w-3" /> Back to Store
              </Link>
              <h1 className="text-3xl md:text-4xl font-headline font-bold uppercase tracking-wider">Checkout</h1>
            </div>
            
            {/* Stepper */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step === 'shipping' ? "bg-primary text-white" : "bg-green-100 text-green-700"
                )}>
                  {step === 'payment' ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Shipping</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  step === 'payment' ? "bg-primary text-white border-primary" : 
                  step === 'verification' ? "bg-green-100 text-green-700 border-green-100" :
                  "border-muted-foreground/20 text-muted-foreground"
                )}>
                  {step === 'verification' ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Payment</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                  step === 'verification' ? "bg-primary text-white border-primary" : "border-muted-foreground/20 text-muted-foreground"
                )}>
                  3
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Verify</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Forms */}
            <div className="lg:col-span-7 space-y-8">
              {step === 'shipping' ? (
                <form onSubmit={handleNextStep} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border space-y-8">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-headline font-bold uppercase tracking-widest">Delivery Address</h2>
                    </div>
                    {user && (
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-secondary/30">
                        Saved: {savedAddresses?.length || 0}
                      </Badge>
                    )}
                  </div>

                  {/* Saved Addresses Selector */}
                  {user && savedAddresses && savedAddresses.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select from saved addresses</Label>
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                        {savedAddresses.map((sa) => (
                          <div 
                            key={sa.id}
                            onClick={() => {
                              setSelectedAddressId(sa.id);
                              setAddress({
                                name: sa.name,
                                phone: sa.phone,
                                line1: sa.line1,
                                city: sa.city,
                                state: sa.state,
                                pincode: sa.pincode,
                                label: sa.label
                              });
                              setSaveForFuture(false);
                            }}
                            className={cn(
                              "flex-shrink-0 w-64 p-4 rounded-2xl border-2 transition-all cursor-pointer relative group",
                              selectedAddressId === sa.id 
                                ? "border-primary bg-primary/5 shadow-md" 
                                : "border-slate-100 bg-slate-50/50 hover:border-primary/20 hover:bg-white"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge className="text-[8px] font-bold uppercase tracking-tighter bg-slate-900">
                                {sa.label}
                              </Badge>
                              {selectedAddressId === sa.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                            <h4 className="text-xs font-bold truncate mb-1">{sa.name}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                              {sa.line1}, {sa.city}, {sa.pincode}
                            </p>
                            <p className="text-[10px] font-bold mt-2">{sa.phone}</p>
                          </div>
                        ))}
                        
                        {/* Add New Option */}
                        <div 
                          onClick={() => {
                            setSelectedAddressId(null);
                            setAddress({
                              name: profile?.name || user.displayName || '',
                              phone: profile?.phone || user.phoneNumber || '',
                              line1: '',
                              city: '',
                              state: '',
                              pincode: '',
                              label: 'Home'
                            });
                          }}
                          className={cn(
                            "flex-shrink-0 w-48 p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                            selectedAddressId === null 
                              ? "border-primary bg-primary/5 text-primary" 
                              : "border-slate-200 text-muted-foreground hover:bg-slate-50"
                          )}
                        >
                          <Plus className="h-5 w-5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Add New</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Address Label (Visible only for new addresses or when editing) */}
                    {!selectedAddressId && (
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="label" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Address Type (e.g. Home, Office)</Label>
                        <div className="flex gap-2">
                          {['Home', 'Office', 'Other'].map(l => (
                            <Button 
                              key={l}
                              type="button"
                              variant={address.label === l ? 'default' : 'outline'}
                              size="sm"
                              className="rounded-full h-8 px-4 text-[9px] font-bold uppercase tracking-widest"
                              onClick={() => setAddress({...address, label: l})}
                            >
                              {l}
                            </Button>
                          ))}
                          <Input 
                            placeholder="Custom Label"
                            className="rounded-full h-8 text-[10px] max-w-[120px]"
                            value={!['Home', 'Office', 'Other'].includes(address.label) ? address.label : ''}
                            onChange={(e) => setAddress({...address, label: e.target.value})}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                      <Input 
                        id="name" 
                        required 
                        placeholder="Enter your full name"
                        className="rounded-xl h-12"
                        value={address.name}
                        onChange={(e) => setAddress({...address, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Number</Label>
                      <Input 
                        id="phone" 
                        required 
                        placeholder="e.g. +91 98765 43210"
                        className="rounded-xl h-12"
                        value={address.phone}
                        onChange={(e) => setAddress({...address, phone: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Street Address / House No.</Label>
                      <Input 
                        id="address" 
                        required 
                        placeholder="Enter house number and street name"
                        className="rounded-xl h-12"
                        value={address.line1}
                        onChange={(e) => setAddress({...address, line1: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">City</Label>
                      <Input 
                        id="city" 
                        required 
                        placeholder="Enter your city"
                        className="rounded-xl h-12"
                        value={address.city}
                        onChange={(e) => setAddress({...address, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">State</Label>
                      <Input 
                        id="state" 
                        required 
                        placeholder="e.g. Maharashtra"
                        className="rounded-xl h-12"
                        value={address.state}
                        onChange={(e) => setAddress({...address, state: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pincode</Label>
                      <Input 
                        id="pincode" 
                        required 
                        placeholder="6-digit pincode"
                        className="rounded-xl h-12"
                        value={address.pincode}
                        onChange={(e) => setAddress({...address, pincode: e.target.value})}
                      />
                    </div>
                  </div>

                  {user && !selectedAddressId && (
                    <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <Checkbox 
                        id="saveAddress" 
                        checked={saveForFuture}
                        onCheckedChange={(checked) => setSaveForFuture(!!checked)}
                      />
                      <label htmlFor="saveAddress" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">
                        Save this address for future purchases
                      </label>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-14 rounded-full font-bold uppercase text-xs tracking-[0.2em] shadow-lg">
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              ) : step === 'payment' ? (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-headline font-bold uppercase tracking-widest">Payment Method</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border-2 border-primary/20 flex flex-col items-center text-center space-y-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm underline underline-offset-4 decoration-primary/20">Scan & Pay via UPI</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Secure transaction verified by Boutique</p>
                      </div>
                      
                      {/* Dynamic UPI Payment Component */}
                      <UPIPayment 
                        amount={total} 
                        merchantName={merchantName}
                        upiId={upiId}
                        orderId="Checkout" 
                        className="mt-4" 
                      />

                      <div className="pt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-3 text-left">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-blue-800 font-bold leading-normal uppercase tracking-tighter italic">
                          After paying, click "Complete Order" to upload your payment screenshot.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" onClick={() => setStep('shipping')} className="flex-1 h-14 rounded-full font-bold uppercase text-[10px] tracking-widest">
                      Back to Shipping
                    </Button>
                    <Button 
                      onClick={handlePlaceOrder} 
                      disabled={isProcessing}
                      className="flex-[2] h-14 rounded-full bg-slate-900 hover:bg-black text-white font-bold uppercase text-xs tracking-[0.2em] shadow-xl border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 transition-all"
                    >
                      {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "I have Paid, Complete Order"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border space-y-8 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <Upload className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-headline font-bold uppercase tracking-widest">Verify Payment</h2>
                  </div>
                  
                  {createdOrderId && (
                    <PaymentVerification 
                      orderId={createdOrderId} 
                      userId={user?.uid || ''}
                      total={total} 
                      onComplete={handleVerificationComplete} 
                    />
                  )}
                </div>
              )}

              {/* Trust Strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                 <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-primary opacity-60" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">Authentic <br />Boutique</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
                    <Lock className="h-5 w-5 text-primary opacity-60" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">Secure <br />SSL Encrypted</span>
                 </div>
                 <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm hidden md:flex">
                    <Truck className="h-5 w-5 text-primary opacity-60" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-tight">Free <br />Express Shipping</span>
                 </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden sticky top-28">
                <div className="p-6 md:p-8 bg-secondary/20 border-b">
                  <h2 className="text-lg font-headline font-bold uppercase tracking-widest">Order Summary</h2>
                </div>
                
                <div className="p-6 md:p-8 space-y-6">
                  {/* Items List */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {items.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex gap-4">
                        <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold truncate font-headline">{item.name}</h4>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Size: {item.size} × {item.quantity}</p>
                        </div>
                        <span className="text-xs font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Calculations */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                      <span>Shipping</span>
                      <span className={deliveryCharge === 0 ? "text-green-600 font-bold" : ""}>
                        {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-xs text-green-600 font-bold animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-1 group">
                          <span>Discount ({appliedCoupon.code})</span>
                          <button onClick={removeCoupon} className="hover:text-red-500 transition-colors">
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                        <span>-₹{appliedCoupon.discount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base font-bold text-primary pt-2">
                      <span>Total Amount</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Coupon Section */}
                  {!appliedCoupon && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Enter Code" 
                            className={cn("pl-10 h-11 rounded-xl text-xs font-bold uppercase tracking-widest", couponError && "border-red-300 bg-red-50")}
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                          />
                        </div>
                        <Button 
                          variant="secondary" 
                          className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-slate-900 text-white hover:bg-black"
                          onClick={() => handleApplyCoupon()}
                          disabled={isValidatingCoupon || !couponCode}
                        >
                          {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                      {couponError && <p className="text-[10px] text-red-500 font-bold ml-1">{couponError}</p>}
                    </div>
                  )}

                  {/* Coupon Suggestions & Upsell */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-amber-500" /> Exclusive Offers
                    </h3>
                    <div className="space-y-3">
                      {availableCoupons.filter(c => !appliedCoupon || appliedCoupon.id !== c.id).map((coupon) => {
                        const isValueLocked = coupon.minOrderValue && subtotal < coupon.minOrderValue;
                        const isQtyLocked = coupon.minQuantity && items.reduce((a,b) => a+b.quantity, 0) < coupon.minQuantity;
                        const isLocked = isValueLocked || isQtyLocked;
                        
                        return (
                          <div 
                            key={coupon.id} 
                            onClick={() => !isLocked && handleApplyCoupon(coupon.code)}
                            className={cn(
                              "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                              isLocked ? "bg-slate-50/50 border-slate-100 opacity-60 grayscale cursor-not-allowed" : "bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black font-mono tracking-wider">{coupon.code}</span>
                                {isLocked && <Lock className="h-2.5 w-2.5 text-slate-400" />}
                              </div>
                              <p className="text-[9px] text-muted-foreground font-medium truncate">{coupon.description}</p>
                              {isValueLocked && (
                                <p className="text-[8px] text-primary font-bold mt-1">
                                  Add ₹{(coupon.minOrderValue! - subtotal).toLocaleString()} more to unlock!
                                </p>
                              )}
                              {isQtyLocked && !isValueLocked && (
                                <p className="text-[8px] text-primary font-bold mt-1">
                                  Add {coupon.minQuantity! - items.reduce((a,b) => a+b.quantity, 0)} more items to unlock!
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                               <Badge className="bg-white text-slate-900 text-[8px] font-bold tracking-tighter px-1.5 h-5 flex items-center gap-1">
                                 {coupon.rewardType === 'PERCENTAGE' ? <Percent className="h-2 w-2" /> : "₹"}{coupon.rewardValue}{coupon.rewardType === 'PERCENTAGE' ? " OFF" : ""}
                               </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Boutique Note */}
                  <div className="p-4 bg-accent/5 rounded-xl border border-accent/10">
                    <p className="text-[10px] text-accent font-medium leading-relaxed italic text-center">
                      "Each piece from Pehnava is packed with love and intention. We can't wait for it to reach you." — Neha
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

