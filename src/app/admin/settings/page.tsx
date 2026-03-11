'use client';

import React, { useState } from 'react';
import { 
  Save, 
  Globe, 
  CreditCard, 
  Truck, 
  Bell, 
  ShieldCheck, 
  Loader2,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Settings as SettingsIcon,
  Layout,
  MessageSquare,
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

export default function SettingsAdminPage() {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Settings Saved",
        description: "Your boutique configuration has been updated successfully.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
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

        {/* General Settings */}
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
                      <Input defaultValue="Pehnava by Neha" className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Support Email</Label>
                      <Input defaultValue="hello@pehnavabyneha.com" className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Business WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input defaultValue="+91 88888 99999" className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Instagram Handle</Label>
                      <div className="relative">
                        <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input defaultValue="@pehnavabyneha" className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50/50" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Jaipur Studio Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                      <textarea 
                        className="w-full min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/50 p-4 pl-12 text-sm focus:ring-primary/20 outline-none ring-2 ring-transparent transition-all"
                        defaultValue="45-A, Heritage Lane, Mansarovar, Jaipur, Rajasthan 302020"
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
                      All administrative changes are tracked for security. Currently logged in as <span className="text-white font-bold">Neha Sharma</span>.
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

        {/* Payments & Shipping Settings */}
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
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Store UPI ID (Linked to QR)</Label>
                    <Input defaultValue="pehnavabyneha@okaxis" className="h-12 rounded-xl border-slate-200 bg-white" />
                    <p className="text-[9px] text-muted-foreground italic font-medium">* This ID is displayed during the checkout payment step.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="space-y-0.5">
                    <h5 className="text-sm font-bold uppercase tracking-tight">Cash on Delivery (COD)</h5>
                    <p className="text-[10px] text-muted-foreground">Only available for orders above ₹1000.</p>
                  </div>
                  <Switch checked={false} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest">Logistics & Fees</CardTitle>
                <CardDescription className="text-xs">Set thresholds and delivery timelines.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Free Delivery Threshold (₹)</Label>
                    <Input defaultValue="2999" type="number" className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Standard Shipping Fee (₹)</Label>
                    <Input defaultValue="99" type="number" className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Default Delivery Message</Label>
                    <Input defaultValue="Delivered in 5-7 working days" className="h-12 rounded-xl border-slate-100 bg-slate-50/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Storefront Settings */}
        <TabsContent value="storefront" className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-headline font-bold uppercase tracking-widest text-primary">Interface & Engagement</CardTitle>
              <CardDescription className="text-xs">Control the live customer experience on the storefront.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-10">
              {/* Announcement Bar */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-accent fill-accent" />
                  <h5 className="text-sm font-bold uppercase tracking-widest">Ticker Tape / Announcement</h5>
                </div>
                <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-tighter">Visible on Boutique</Label>
                    <Switch checked={true} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Carousel Messages (One per line)</Label>
                    <textarea 
                      className="w-full min-h-[120px] rounded-2xl border-slate-100 bg-white p-4 text-xs font-medium focus:ring-primary/20 outline-none ring-2 ring-transparent shadow-sm transition-all"
                      defaultValue={`✨ FREE DELIVERY ON ALL PREPAID ORDERS ABOVE ₹2999 ✨\n🔥 NEW ARRIVALS: THE WEDDING EDIT IS NOW LIVE 🔥\n🎁 UP TO 30% OFF ON SELECTED FESTIVE WEAR 🎁`}
                    />
                  </div>
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h5 className="text-sm font-bold uppercase tracking-widest">Smart Boutique Features</h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white border-2 border-slate-50 shadow-sm">
                    <div className="space-y-1">
                      <h6 className="text-xs font-bold uppercase tracking-tight">Recent Purchase Popups</h6>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Display proof-of-sale to new visitors.</p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-white border-2 border-slate-50 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h6 className="text-xs font-bold uppercase tracking-tight">AI Boutique Assistant</h6>
                        <Badge className="bg-primary text-white text-[8px] h-4 font-bold tracking-tighter">GENKIT</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Enable the floating Genkit chat interface.</p>
                    </div>
                    <Switch checked={true} />
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
