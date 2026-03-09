"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
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
              <Link href="/collections/western-fusion" className="text-sm hover:text-primary transition-colors">Western & Fusion</Link>
              <Link href="/collections/accessories" className="text-sm hover:text-primary transition-colors">Accessories</Link>
              <Link href="/collections/sale" className="text-sm text-primary font-bold hover:underline">Clearance Sale</Link>
              <Link href="/collections/new-arrivals" className="text-sm hover:text-primary transition-colors">New Arrivals</Link>
            </nav>
          </div>

          {/* Policy Links */}
          <div className="flex flex-col space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Policies</h4>
            <nav className="flex flex-col space-y-3">
              <Link href="/policies/shipping" className="text-sm hover:text-primary transition-colors">Shipping Policy</Link>
              <Link href="/policies/returns" className="text-sm hover:text-primary transition-colors">Return & Exchange</Link>
              <Link href="/policies/privacy" className="text-sm hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/policies/terms" className="text-sm hover:text-primary transition-colors">Terms of Service</Link>
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

        <Separator className="my-12" />

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
    </footer>
  );
}

const Separator = ({ className }: { className?: string }) => (
  <div className={`h-px w-full bg-border ${className}`} />
);
