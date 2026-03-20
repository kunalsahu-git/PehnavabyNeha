"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  MessageSquare,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  Calendar,
  Sparkles,
  Package,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { createContactMessage } from "@/firebase/firestore/contact_messages";
import Link from "next/link";
import { cn } from "@/lib/utils";

const INQUIRY_TYPES = [
  { value: "studio-visit", label: "Book a Studio Visit", icon: Calendar, description: "Schedule a personal styling session at our Jaipur boutique" },
  { value: "custom-order", label: "Custom Order", icon: Sparkles, description: "Discuss a bespoke piece tailored to your vision" },
  { value: "order-support", label: "Order Support", icon: Package, description: "Track, modify, or return an existing order" },
  { value: "general", label: "General Inquiry", icon: HelpCircle, description: "Any other question or feedback" },
];

export default function ContactPage() {
  return (
    <Suspense>
      <ContactPageInner />
    </Suspense>
  );
}

function ContactPageInner() {
  const db = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [inquiryType, setInquiryType] = useState(() => {
    const param = searchParams.get("inquiry");
    return INQUIRY_TYPES.some(t => t.value === param) ? param! : "";
  });

  useEffect(() => {
    const param = searchParams.get("inquiry");
    if (param && INQUIRY_TYPES.some(t => t.value === param)) setInquiryType(param);
  }, [searchParams]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryType) {
      toast({ variant: "destructive", title: "Select an inquiry type", description: "Please choose what you'd like to contact us about." });
      return;
    }

    setIsSubmitting(true);
    try {
      if (db) {
        await createContactMessage(db, {
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          inquiryType,
          subject: form.subject || INQUIRY_TYPES.find(t => t.value === inquiryType)?.label || inquiryType,
          message: form.message,
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Something went wrong", description: "Please try again or reach us via WhatsApp." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-secondary/10 min-h-screen">
      {/* Banner */}
      <section className="bg-primary/5 py-20 md:py-32 border-b">
        <div className="container mx-auto px-4 text-center space-y-6">
          <nav className="flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="opacity-30">/</span>
            <span className="text-primary">Contact Us</span>
          </nav>
          <h1 className="text-4xl md:text-6xl font-headline font-bold uppercase tracking-wider">Get in Touch</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Whether you want to book a personal styling session, discuss a custom order, or simply say hello — Neha and her team are here for you.
          </p>
          <div className="h-1 w-24 bg-accent/40 rounded-full mx-auto" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

          {/* Left: Contact Info */}
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-8">
              <h2 className="text-2xl font-headline font-bold uppercase tracking-widest">Connect with Neha</h2>
              <div className="space-y-6">
                <div className="flex gap-6 group">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Boutique Location</h3>
                    <p className="text-sm font-medium leading-relaxed">
                      45-A, Heritage Lane, Mansarovar,<br /> Jaipur, Rajasthan 302020, India
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Direct Line</h3>
                    <p className="text-sm font-medium">+91 88888 99999</p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Inquiries</h3>
                    <p className="text-sm font-medium">hello@pehnavabyneha.com</p>
                  </div>
                </div>
                <div className="flex gap-6 group">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Studio Hours</h3>
                    <p className="text-sm font-medium">Mon – Sat: 11:00 AM – 08:00 PM IST</p>
                    <p className="text-[10px] text-muted-foreground font-bold italic">Sunday by Appointment Only</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-3xl text-white space-y-6">
              <h3 className="text-xl font-headline font-bold">Follow Our Journey</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Stay updated with our latest collections, styling tips, and BTS from our Jaipur studio.
              </p>
              <div className="flex gap-4">
                <Button asChild variant="secondary" size="sm" className="rounded-full gap-2 text-[10px] font-bold uppercase tracking-widest h-10 px-6">
                  <Link href="#"><Instagram className="h-3.5 w-3.5" /> Instagram</Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="rounded-full gap-2 text-[10px] font-bold uppercase tracking-widest h-10 px-6">
                  <Link href="#"><MessageSquare className="h-3.5 w-3.5" /> WhatsApp</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-50">

              {submitted ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-headline font-bold">Message Received!</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Thank you, <span className="font-bold text-foreground">{form.name}</span>. Neha and the team will get back to you within 24 hours.
                    </p>
                  </div>
                  {inquiryType === "studio-visit" && (
                    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 text-sm text-muted-foreground max-w-sm">
                      <p className="font-bold text-foreground mb-1">Studio Visit Request</p>
                      <p>We'll confirm your preferred date and time via WhatsApp or email shortly.</p>
                    </div>
                  )}
                  <Button variant="outline" className="rounded-full" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); setInquiryType(""); }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-8 text-center md:text-left">
                    <h2 className="text-2xl font-headline font-bold uppercase tracking-widest">Send a Message</h2>
                    <p className="text-sm text-muted-foreground">We usually respond within 24 hours.</p>
                  </div>

                  {/* Inquiry Type Selector */}
                  <div className="mb-8 space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What can we help you with?</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {INQUIRY_TYPES.map(type => {
                        const Icon = type.icon;
                        const active = inquiryType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setInquiryType(type.value)}
                            className={cn(
                              "flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                              active
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/40 hover:bg-slate-50"
                            )}
                          >
                            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors", active ? "bg-primary text-white" : "bg-secondary text-muted-foreground")}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className={cn("text-xs font-bold", active ? "text-primary" : "text-foreground")}>{type.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{type.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Name *</Label>
                        <Input id="name" required placeholder="Full Name" className="h-12 rounded-xl" value={form.name} onChange={e => set("name", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address *</Label>
                        <Input id="email" type="email" required placeholder="hello@example.com" className="h-12 rounded-xl" value={form.email} onChange={e => set("email", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">WhatsApp Number <span className="normal-case font-normal text-muted-foreground">(optional)</span></Label>
                        <Input id="phone" type="tel" placeholder="+91 9876543210" className="h-12 rounded-xl" value={form.phone} onChange={e => set("phone", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</Label>
                        <Input id="subject" placeholder={INQUIRY_TYPES.find(t => t.value === inquiryType)?.label || "How can we help?"} className="h-12 rounded-xl" value={form.subject} onChange={e => set("subject", e.target.value)} />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Message *</Label>
                        <Textarea
                          id="message"
                          required
                          placeholder={
                            inquiryType === "studio-visit" ? "Tell us your preferred date/time for a studio visit..." :
                            inquiryType === "custom-order" ? "Describe the outfit you have in mind — occasion, fabric preferences, budget..." :
                            inquiryType === "order-support" ? "Please share your order ID and describe the issue..." :
                            "Write your message here..."
                          }
                          className="min-h-[140px] rounded-xl resize-none"
                          value={form.message}
                          onChange={e => set("message", e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase text-xs tracking-[0.2em] shadow-lg transition-all active:scale-95"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">Send Message <Send className="h-4 w-4" /></span>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Boutique Note */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-accent">Personal Touch</span>
          <p className="font-headline text-2xl md:text-3xl italic text-muted-foreground leading-relaxed">
            "We believe in creating lasting relationships with our clients. If you're ever in Jaipur, please drop by for a cup of tea and a talk about heritage textiles."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">— Neha</p>
        </div>
      </section>
    </div>
  );
}
