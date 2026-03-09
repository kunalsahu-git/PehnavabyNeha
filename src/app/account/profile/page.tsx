
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCircle, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  LogOut, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthMonth: '',
    birthYear: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        birthMonth: '',
        birthYear: ''
      });
    } else if (!isUserLoading) {
      router.push('/account/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Signed Out", description: "Successfully logged out of your boutique account." });
    router.push('/');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Profile Updated", description: "Your details have been saved successfully." });
    }, 1500);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-secondary/10 min-h-screen pb-20">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex flex-col md:flex-row gap-10">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-1/3 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border text-center space-y-4">
                <div className="relative inline-block">
                  <div className="h-24 w-24 bg-primary/5 rounded-full flex items-center justify-center border-2 border-primary/10">
                    <UserCircle className="h-12 w-12 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <Star className="h-4 w-4 text-white fill-current" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-headline font-bold">{formData.name || 'Boutique Member'}</h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Premium Customer</p>
                </div>
              </div>

              <nav className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="p-4 border-b bg-slate-50">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground px-2">Account Dashboard</h3>
                </div>
                <div className="flex flex-col">
                  <Link href="/account/profile" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors bg-primary/5 border-l-4 border-primary">
                    <span className="text-sm font-bold text-primary">Profile Details</span>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </Link>
                  <Link href="/account/orders" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium">My Orders</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </Link>
                  <Link href="/wishlist" className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium">Wishlist</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 p-4 hover:bg-red-50 text-red-600 transition-colors mt-4">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase tracking-widest">Logout</span>
                  </button>
                </div>
              </nav>

              <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4">
                <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-headline font-bold">Safe & Secure</h4>
                <p className="text-xs text-white/60 leading-relaxed">Your data is protected with high-level encryption. We value your privacy.</p>
              </div>
            </div>

            {/* Main Content Form */}
            <div className="flex-1">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border space-y-10">
                <div className="space-y-2 border-b pb-6">
                  <h1 className="text-3xl font-headline font-bold uppercase tracking-wider">Profile Information</h1>
                  <p className="text-muted-foreground text-sm">Update your boutique profile for a more personalized experience.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <UserCircle className="h-3 w-3" /> Full Name
                      </Label>
                      <Input 
                        id="name" 
                        className="h-12 rounded-xl focus:ring-primary" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" /> WhatsApp Number
                      </Label>
                      <Input 
                        id="phone" 
                        className="h-12 rounded-xl focus:ring-primary bg-slate-50" 
                        value={formData.phone}
                        readOnly
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" /> Email Address
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        className="h-12 rounded-xl focus:ring-primary" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-accent" />
                      <h3 className="text-sm font-bold uppercase tracking-widest">Special Occasions</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Share your birthday to receive exclusive boutique surprises on your special day.</p>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-sm">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Birth Month</Label>
                        <select className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="">Select Month</option>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Birth Year</Label>
                        <Input className="h-12 rounded-xl" placeholder="YYYY" maxLength={4} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-full font-bold uppercase text-xs tracking-[0.3em] shadow-xl transition-all active:scale-95">
                      {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Profile Details"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
