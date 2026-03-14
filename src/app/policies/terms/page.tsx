
'use client';

import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary mb-10 transition-colors">
          <ArrowLeft className="mr-2 h-3 w-3" /> Back to Boutique
        </Link>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Terms of Service</h1>
          </div>

          <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground italic">Effective Date: October 2024</p>
            
            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">1. Boutique Relationship</h2>
              <p>
                By using the Pehnava by Neha website, you agree to comply with our service terms. Our boutique provides curated luxury fashion, and your use of our platform constitutes a professional agreement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">2. Product Authenticity & Display</h2>
              <p>
                We strive to display product colors and textures as accurately as possible. However, slight variations may occur due to screen settings or the handcrafted nature of our South Asian fabrics. All products are verified for quality before dispatch.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">3. Pricing & Payments</h2>
              <p>
                All prices are in INR and include GST. We primarily use a manual UPI Scan & Pay system. Orders are only considered "Confirmed" after our admin team manually verifies your uploaded payment screenshot.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">4. Shipping & Returns</h2>
              <p>
                We offer a 7-day return policy for unworn items with tags. Please refer to our Shipping Policy for detailed timelines. Custom-made outfits and altered garments are not eligible for returns.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">5. Intellectual Property</h2>
              <p>
                All designs, images, and content on this site are the property of Pehnava by Neha and cannot be used without explicit written permission.
              </p>
            </section>

            <section className="space-y-3 pt-8 border-t">
              <p className="text-sm">
                By shopping with us, you celebrate heritage and support artisan craftsmanship. Thank you for being part of our story.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
