
'use client';

import { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [address, setAddress] = useState({
    name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    pincode: ''
  });

  const deliveryCharge = subtotal > 2999 ? 0 : 99;
  const total = subtotal + deliveryCharge;

  const handleNextStep = (e: React.FormEvent) => {
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
    setStep('payment');
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    // Simulate order processing
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      router.push('/checkout/success');
      toast({
        title: "Order Placed!",
        description: "We've received your order and are verifying payment.",
      });
    }, 2500);
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
                  step === 'payment' ? "bg-primary text-white border-primary" : "border-muted-foreground/20 text-muted-foreground"
                )}>
                  2
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Forms */}
            <div className="lg:col-span-7 space-y-8">
              {step === 'shipping' ? (
                <form onSubmit={handleNextStep} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border space-y-8">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-headline font-bold uppercase tracking-widest">Delivery Address</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                      <Input 
                        id="name" 
                        required 
                        placeholder="Neha Sharma"
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
                        placeholder="+91 98765 43210"
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
                        placeholder="45A, Rose Avenue"
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
                        placeholder="Jaipur"
                        className="rounded-xl h-12"
                        value={address.city}
                        onChange={(e) => setAddress({...address, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pincode</Label>
                      <Input 
                        id="pincode" 
                        required 
                        placeholder="302001"
                        className="rounded-xl h-12"
                        value={address.pincode}
                        onChange={(e) => setAddress({...address, pincode: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-14 rounded-full font-bold uppercase text-xs tracking-[0.2em] shadow-lg">
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-headline font-bold uppercase tracking-widest">Payment Method</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border-2 border-primary/20 flex flex-col items-center text-center space-y-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Image src="https://placehold.co/40x24/png?text=UPI" width={32} height={20} alt="UPI" className="opacity-80" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm">Scan & Pay via UPI</h3>
                        <p className="text-xs text-muted-foreground">Safe, fast, and secure. Verified by Neha.</p>
                      </div>
                      <div className="relative aspect-square w-48 bg-white p-2 rounded-xl border-2 border-slate-100 shadow-sm">
                        <Image 
                          src="https://placehold.co/200x200/png?text=QR+CODE" 
                          alt="Payment QR" 
                          fill 
                          className="object-contain"
                        />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">UPI ID: pehnavabyneha@okaxis</p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block text-center">Upload Payment Screenshot</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 hover:border-primary/40 transition-colors cursor-pointer group bg-slate-50/50">
                        <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">Click or drag proof of payment here</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">JPG, PNG up to 5MB</p>
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
                      className="flex-[2] h-14 rounded-full bg-slate-900 hover:bg-black text-white font-bold uppercase text-xs tracking-[0.2em] shadow-xl"
                    >
                      {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Order"}
                    </Button>
                  </div>
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
                    <div className="flex justify-between text-base font-bold text-primary pt-2">
                      <span>Total Amount</span>
                      <span>₹{total.toLocaleString()}</span>
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

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
