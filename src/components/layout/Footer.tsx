
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Instagram, Facebook, Twitter, ShieldCheck, Truck, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { getAllCategoriesQuery, type CategoryData } from "@/firebase/firestore/categories";

type PolicyType = 'shipping' | 'returns' | 'privacy' | 'terms' | null;

// Static fallback — shown if Firestore categories haven't loaded yet
const FALLBACK_SHOPPING_LINKS = [
  { name: 'Sarees', href: '/collections/sarees' },
  { name: 'Lehengas', href: '/collections/lehengas' },
  { name: 'Accessories', href: '/collections/accessories' },
  { name: 'Bridal Wear', href: '/collections/bridal-wear' },
  { name: 'New Arrivals', href: '/collections/new-arrivals' },
];

export function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  // Live categories from Firestore — fallback to static if empty
  const db = useFirestore();
  const categoriesQuery = useMemoFirebase(() => db ? getAllCategoriesQuery(db) : null, [db]);
  const { data: allCategories } = useCollection<CategoryData>(categoriesQuery);
  const firestoreShoppingLinks = (allCategories ?? [])
    .filter(c => c.published)
    .slice(0, 6)
    .map(c => ({ name: c.name, href: `/collections/${c.slug}` }));
  const shoppingLinks = firestoreShoppingLinks.length > 0 ? firestoreShoppingLinks : FALLBACK_SHOPPING_LINKS;

  const policyContent = {
    shipping: {
      title: "Shipping Policy",
      icon: <Truck className="h-6 w-6 text-primary" />,
      description: "How we get our beautiful pieces to your doorstep.",
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>We offer <strong>Free Standard Shipping</strong> on all prepaid orders within India above ₹2999. For orders below this amount, a flat shipping fee of ₹99 is applicable.</p>
          <p><strong>Processing Time:</strong> Orders are typically processed and dispatched within 1-2 business days from our Jaipur boutique.</p>
          <p><strong>Delivery Timeline:</strong> Once dispatched, standard delivery takes 5-7 business days depending on your location. Express shipping options may be available at checkout for an additional charge.</p>
          <p><strong>Tracking:</strong> You will receive a tracking number via WhatsApp and Email once your order is on its way.</p>
        </div>
      )
    },
    returns: {
      title: "Return & Exchange",
      icon: <RefreshCw className="h-6 w-6 text-primary" />,
      description: "Our commitment to your satisfaction.",
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>Pehnava by Neha offers a <strong>7-day easy return and exchange policy</strong> for all unworn, unwashed items with original tags and packaging intact.</p>
          <p><strong>How to initiate:</strong> Please contact our WhatsApp support team or email us with your Order ID to initiate a return request.</p>
          <p><strong>Exclusions:</strong> Custom-made outfits, altered garments, and accessories (for hygiene reasons) are not eligible for returns unless they arrive damaged.</p>
          <p><strong>Refunds:</strong> Once the quality check is passed at our warehouse, refunds are processed to your original payment method within 5-7 business days.</p>
        </div>
      )
    },
    privacy: {
      title: "Privacy Policy",
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      description: "Your data security is our priority.",
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>We value the trust you place in us. That's why we insist upon the highest standards for secure transactions and customer information privacy.</p>
          <p><strong>Information Collection:</strong> We collect information like name, phone number, and address primarily to process your orders and provide a personalized boutique experience.</p>
          <p><strong>Data Usage:</strong> Your data is never sold to third parties. We use it for order fulfillment, customer support, and (if you opt-in) exclusive boutique updates.</p>
          <p><strong>Secure Payments:</strong> All UPI and card transactions are encrypted and processed through verified secure payment gateways.</p>
        </div>
      )
    },
    terms: {
      title: "Terms of Service",
      icon: <FileText className="h-6 w-6 text-primary" />,
      description: "The fine print of our boutique relationship.",
      content: (
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>By using the Pehnava by Neha website, you agree to comply with our service terms.</p>
          <p><strong>Product Representation:</strong> We strive to display product colors and textures as accurately as possible. However, slight variations may occur due to screen settings or the handcrafted nature of our fabrics.</p>
          <p><strong>Pricing:</strong> All prices are in INR and include GST. Prices are subject to change without prior notice, but will not affect confirmed orders.</p>
          <p><strong>Intellectual Property:</strong> All designs, images, and content on this site are the property of Pehnava by Neha and cannot be used without explicit permission.</p>
        </div>
      )
    }
  };

  return (
    <footer className="bg-secondary/40 border-t">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Col */}
          <div className="flex flex-col space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/images/logo.svg" alt="Pehnava by Neha" width={48} height={48} className="h-12 w-12 object-contain" />
              <div className="flex flex-col leading-none gap-0.5">
                <span className="text-2xl font-headline font-bold text-primary tracking-tighter">PEHNAVA</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-primary/30" />
                  <span className="text-[11px] font-headline italic font-semibold text-primary/70 tracking-[0.15em]">by Neha</span>
                  <div className="h-px flex-1 bg-primary/30" />
                </div>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Curating luxury South Asian fashion that blends tradition with modern femininity. Every piece tells a story of heritage and handcrafted elegance.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links — LIVE from Firestore categories (fallback: FALLBACK_SHOPPING_LINKS) */}
          <div className="flex flex-col space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Shopping</h4>
            <nav className="flex flex-col space-y-3">
              <Link href="/about" className="text-sm hover:text-primary transition-colors">Our Story</Link>
              {shoppingLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-sm hover:text-primary transition-colors">
                  {link.name}
                </Link>
              ))}
              <Link href="/collections/sale" className="text-sm text-primary font-bold hover:underline">Clearance Sale</Link>
            </nav>
          </div>

          {/* Policy Links */}
          <div className="flex flex-col space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Support</h4>
            <nav className="flex flex-col items-start space-y-3">
              <button onClick={() => setActivePolicy('shipping')} className="text-sm hover:text-primary transition-colors">Shipping Policy</button>
              <button onClick={() => setActivePolicy('returns')} className="text-sm hover:text-primary transition-colors">Return & Exchange</button>
              <button onClick={() => setActivePolicy('privacy')} className="text-sm hover:text-primary transition-colors">Privacy Policy</button>
              <button onClick={() => setActivePolicy('terms')} className="text-sm hover:text-primary transition-colors">Terms of Service</button>
              <Link href="/contact" className="text-sm hover:text-primary transition-colors">Contact Us</Link>
              <div className="pt-3 border-t border-border/60 w-full">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Admin Panel
                </Link>
              </div>
            </nav>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Newsletter</h4>
            <p className="text-sm text-muted-foreground">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <div className="flex flex-col space-y-3">
              <Input placeholder="Enter your email" className="bg-white border-primary/20" />
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-border my-12" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pehnava by Neha. All Rights Reserved.
          </p>
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Secure Payments</p>
            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
              {[
                { src: '/images/payment/Bhim-Upi-Logo.png', alt: 'BHIM UPI' },
                { src: '/images/payment/phone-pe.png',       alt: 'PhonePe' },
                { src: '/images/payment/google-pay.png',     alt: 'Google Pay' },
                { src: '/images/payment/paytm.png',          alt: 'Paytm' },
                { src: '/images/payment/amazon-pay.png',     alt: 'Amazon Pay' },
              ].map(({ src, alt }) => (
                <div key={alt} className="h-7 w-14 relative grayscale hover:grayscale-0 transition-all opacity-60 hover:opacity-100">
                  <Image src={src} alt={alt} fill className="object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      <Dialog open={!!activePolicy} onOpenChange={(open) => !open && setActivePolicy(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
          {activePolicy && (
            <>
              <DialogHeader className="space-y-4">
                <div className="h-14 w-14 bg-primary/5 rounded-full flex items-center justify-center">
                  {policyContent[activePolicy].icon}
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-headline font-bold uppercase tracking-wider">
                    {policyContent[activePolicy].title}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-medium text-accent uppercase tracking-[0.2em]">
                    {policyContent[activePolicy].description}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="mt-6 pt-6 border-t">
                {policyContent[activePolicy].content}
              </div>
              <div className="mt-8">
                <Button onClick={() => setActivePolicy(null)} className="w-full rounded-full h-12 font-bold uppercase text-[10px] tracking-widest">
                  Close Modal
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  );
}
