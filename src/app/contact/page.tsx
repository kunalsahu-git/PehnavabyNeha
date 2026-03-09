"use client";

import { useState } from "react";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  MessageSquare, 
  Clock, 
  Send, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. Neha and the team will get back to you shortly.",
      });
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="bg-secondary/10 min-h-screen">
      {/* Banner Section */}
      <section className="bg-primary/5 py-20 md:py-32 border-b">
        <div className="container mx-auto px-4 text-center space-y-6">
          <nav className="flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="opacity-30">/</span>
            <span className="text-primary">Contact Us</span>
          </nav>
          <h1 className="text-4xl md:text-6xl font-headline font-bold uppercase tracking-wider">Get in Touch</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Whether you have a question about our latest collection, need styling advice, or want to track your order, Neha and her team are here to help.
          </p>
          <div className="h-1 w-24 bg-accent/40 rounded-full mx-auto" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Left Side: Contact Info */}
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
                    <p className="text-sm font-medium">Mon - Sat: 11:00 AM - 08:00 PM IST</p>
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

          {/* Right Side: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-50">
              <div className="space-y-2 mb-10 text-center md:text-left">
                <h2 className="text-2xl font-headline font-bold uppercase tracking-widest">Send a Message</h2>
                <p className="text-sm text-muted-foreground">We usually respond within 24 hours.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Name</Label>
                    <Input id="name" required placeholder="Full Name" className="h-12 rounded-xl focus:ring-primary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                    <Input id="email" type="email" required placeholder="hello@example.com" className="h-12 rounded-xl focus:ring-primary" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" className="h-12 rounded-xl focus:ring-primary" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Message</Label>
                    <Textarea 
                      id="message" 
                      required 
                      placeholder="Write your query here..." 
                      className="min-h-[150px] rounded-xl focus:ring-primary resize-none" 
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
                    <div className="flex items-center gap-2">
                      Send Message <Send className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
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
