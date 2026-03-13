'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Globe, 
  CreditCard, 
  ShieldCheck, 
  Loader2,
  Phone,
  MapPin,
  Instagram,
  Layout,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser } from '@/firebase';
import { getBoutiqueSettings, saveBoutiqueSettings, type BoutiqueSettings } from '@/firebase/firestore/settings';

const DEFAULT_SETTINGS: BoutiqueSettings = {
  displayName: 'Pehnava by Neha',
  supportEmail: 'hello@pehnavabyneha.com',
  whatsapp: '+91 88888 99999',
  instagram: '@pehnavabyneha',
  address: '45-A, Heritage Lane, Mansarovar, Jaipur, Rajasthan 302020',
  upiId: 'pehnavabyneha@okaxis',
  codEnabled: false,
  freeDeliveryThreshold: 2999,
  shippingFee: 99,
  deliveryMessage: 'Delivered in 5-7 working days',
  announcementVisible: true,
  announcementMessages: [
    '✨ FREE DELIVERY ON ALL PREPAID ORDERS ABOVE ₹2999 ✨',
    '🔥 NEW ARRIVALS: THE WEDDING EDIT IS NOW LIVE 🔥'
  ],
  purchasePopupsEnabled: true,
  aiAssistantEnabled: true
};

export default function SettingsAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<BoutiqueSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBoutiqueSettings(db);
        if (data) setSettings(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [db]);

  const update = (key: keyof BoutiqueSettings, value: any) => 
    setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveBoutiqueSettings(db, settings);
      toast({ title: "Settings Saved", description: "Boutique configuration updated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not persist settings to Firestore." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Boutique Configuration</h1>
          <p className="text-sm text-muted-foreground">Configure your boutique&apos;s core behavior, payments, and external channels.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-10 shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-8">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 h-auto self-start">
          <TabsTrigger value="general" className="rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Globe className="h-3.5 w-3.5 mr-2" /> General Profile
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <CreditCard className="h-3.5 w-3.5 mr-2" /> Payments & Logistics
          </TabsTrigger>
          <TabsTrigger value="storefront" className="rounded-xl px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Layout className="h-3.5 w-3.5 mr-2" /> Storefront UI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Boutique Profile</CardTitle>
                  <CardDescription className="text-xs">Basic information that appears across the site and invoices.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Boutique Display Name</Label>
                      <Input value={settings.displayName} onChange={(e) => update('displayName', e.target.value)} className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Support Email</Label>
                      <Input value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Business WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={settings.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Instagram Handle</Label>
                      <div className="relative">
                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={settings.instagram} onChange={(e) => update('instagram', e.target.value)} className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Jaipur Studio Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <textarea 
                        className="w-full min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/50 p-4 pl-12 text-sm focus:ring-primary/20 outline-none ring-2 ring-transparent transition-all"
                        value={settings.address}
                        onChange={(e) => update('address', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-slate-900 text-white">
                <CardContent className="p-8 space-y-6">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-headline font-bold uppercase tracking-widest text-accent">Master Access</h4>
                    <p className="text-xs text-white/60 leading-relaxed">
                      All administrative changes are tracked for security. Currently logged in as <span className="text-white font-bold">{user?.displayName || 'Administrator'}</span>.
                    </p>
                  </div>
                  <Separator className="bg-white/10" />
                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10 rounded-xl h-12 text-[10px] uppercase font-bold tracking-widest">
                    Audit Log
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Payment Methods</CardTitle>
                <CardDescription className="text-xs">Manage how customers pay for their luxury pieces.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="p-6 rounded-2xl border-2 border-primary/10 bg-primary/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-sm font-bold uppercase tracking-widest">UPI Scan & Pay</h5>
                        <p className="text-[10px] text-muted-foreground font-bold">Manual Verification Required</p>
                      </div>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Store UPI ID</Label>
                    <Input value={settings.upiId} onChange={(e) => update('upiId', e.target.value)} className="h-12 rounded-xl border-slate-200 bg-white" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-bold uppercase tracking-tight">Cash on Delivery (COD)</h5>
                    <p className="text-[10px] text-muted-foreground">Only available for certain regions.</p>
                  </div>
                  <Switch checked={settings.codEnabled} onCheckedChange={(v) => update('codEnabled', v)} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Logistics</CardTitle>
                <CardDescription className="text-xs">Set thresholds and delivery timelines.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Free Delivery Threshold (₹)</Label>
                    <Input value={settings.freeDeliveryThreshold} type="number" onChange={(e) => update('freeDeliveryThreshold', parseFloat(e.target.value))} className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Standard Shipping Fee (₹)</Label>
                    <Input value={settings.shippingFee} type="number" onChange={(e) => update('shippingFee', parseFloat(e.target.value))} className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Delivery Message</Label>
                    <Input value={settings.deliveryMessage} onChange={(e) => update('deliveryMessage', e.target.value)} className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storefront" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-primary">Interface & Engagement</CardTitle>
              <CardDescription className="text-xs">Control the live customer experience.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-accent fill-accent" />
                  <h5 className="text-sm font-bold uppercase tracking-widest">Announcement Bar</h5>
                </div>
                <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Visible on Storefront</Label>
                    <Switch checked={settings.announcementVisible} onCheckedChange={(v) => update('announcementVisible', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Messages (One per line)</Label>
                    <textarea 
                      className="w-full min-h-[120px] rounded-2xl border-slate-100 bg-white p-4 text-xs font-medium focus:ring-primary/20 outline-none ring-2 ring-transparent shadow-sm transition-all"
                      value={settings.announcementMessages.join('\n')}
                      onChange={(e) => update('announcementMessages', e.target.value.split('\n').filter(Boolean))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h5 className="text-sm font-bold uppercase tracking-widest">Smart Features</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white border-2 border-slate-50 shadow-sm">
                    <div className="space-y-1">
                      <h6 className="text-xs font-bold uppercase tracking-tight">Recent Purchase Popups</h6>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Proof-of-sale for visitors.</p>
                    </div>
                    <Switch checked={settings.purchasePopupsEnabled} onCheckedChange={(v) => update('purchasePopupsEnabled', v)} />
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white border-2 border-slate-50 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h6 className="text-xs font-bold uppercase tracking-tight">AI Assistant</h6>
                        <Badge className="bg-primary text-white text-[8px] h-4 font-bold tracking-tighter">GENKIT</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Floating Genkit chat window.</p>
                    </div>
                    <Switch checked={settings.aiAssistantEnabled} onCheckedChange={(v) => update('aiAssistantEnabled', v)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
