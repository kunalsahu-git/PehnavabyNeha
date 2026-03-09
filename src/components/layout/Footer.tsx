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

type PolicyType = 'shipping' | 'returns' | 'privacy' | 'terms' | null;

export function Footer() {
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

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
            <Link href="/" className="flex flex-col items-start">
              <span className="text-3xl font-headline font-bold text-primary tracking-tighter">PEHNAVA</span>
              <span className="text-xs font-headline font-medium tracking-[0.2em] text-accent -mt-1 uppercase">by Neha</span>
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

          {/* Quick Links */}
          <div className="flex flex-col space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Shopping</h4>
            <nav className="flex flex-col space-y-3">
              <Link href="/collections/ethnic-wear" className="text-sm hover:text-primary transition-colors">Ethnic Wear</Link>
              <Link href="/collections/sarees" className="text-sm hover:text-primary transition-colors">Sarees</Link>
              <Link href="/collections/western-fusion" className="text-sm hover:text-primary transition-colors">Western & Fusion</Link>
              <Link href="/collections/accessories" className="text-sm hover:text-primary transition-colors">Accessories</Link>
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
          <div className="flex items-center space-x-4 opacity-50">
             <Image src="https://placehold.co/40x25/png?text=UPI" width={40} height={25} alt="UPI Payment" />
             <Image src="https://placehold.co/40x25/png?text=VISA" width={40} height={25} alt="Visa" />
             <Image src="https://placehold.co/40x25/png?text=MC" width={40} height={25} alt="Mastercard" />
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
