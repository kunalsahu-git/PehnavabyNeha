
'use client';

import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary mb-10 transition-colors">
          <ArrowLeft className="mr-2 h-3 w-3" /> Back to Boutique
        </Link>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Privacy Policy</h1>
          </div>

          <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground italic">Last Updated: October 2024</p>
            
            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">Introduction</h2>
              <p>
                At Pehnava by Neha, we value the trust you place in us. That's why we insist upon the highest standards for secure transactions and customer information privacy. This Privacy Policy describes how we collect, use, and share your personal information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">Information We Collect</h2>
              <p>
                We collect information like your name, WhatsApp number, email address, and shipping address primarily to process your orders and provide a personalized boutique experience. 
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account Information:</strong> Name, Email, Phone Number.</li>
                <li><strong>Transaction Details:</strong> Payment screenshots (for UPI verification), order history.</li>
                <li><strong>Usage Data:</strong> How you interact with our catalog and AI assistant.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">How We Use Your Data</h2>
              <p>
                Your data is never sold to third parties. We use it exclusively for:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Order fulfillment and shipping updates via WhatsApp.</li>
                <li>Verifying manual UPI payments.</li>
                <li>Providing customer support through our AI assistant or direct team.</li>
                <li>Improving our curated collections based on your preferences.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-headline font-bold text-foreground uppercase tracking-widest">Security</h2>
              <p>
                All transactions are protected by industry-standard encryption. Manual UPI payments require a screenshot upload which is stored securely and accessed only by our authorized admin team for verification.
              </p>
            </section>

            <section className="space-y-3 pt-8 border-t">
              <p className="text-sm italic">
                If you have any questions regarding this policy, please reach out to us at <span className="text-primary font-bold">hello@pehnavabyneha.com</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
