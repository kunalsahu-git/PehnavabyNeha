
'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star, Heart, ShieldCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full pb-20 overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center px-4 pt-20">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                <span className="opacity-30">/</span>
                <span className="text-primary">Our Story</span>
              </nav>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-bold leading-[0.9] tracking-tighter">
                Wear Your <br /> <span className="text-primary italic">Story.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-light">
                At Pehnava by Neha, we believe that clothing is more than just fabric—it's a celebration of heritage, femininity, and the modern woman's journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild className="rounded-full px-10 h-14 bg-primary text-white font-bold uppercase text-xs tracking-widest shadow-xl">
                  <Link href="/collections/all">Explore Collection</Link>
                </Button>
                <Button asChild variant="ghost" className="rounded-full px-10 h-14 font-bold uppercase text-xs tracking-widest gap-2">
                  <Link href="/contact">Get in Touch <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white"
            >
              <Image 
                src={PlaceHolderImages.find(i => i.id === 'about-hero')?.imageUrl || ''} 
                alt="Neha in her Jaipur studio" 
                fill 
                className="object-cover"
                data-ai-hint="fashion designer studio"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.4em] mb-2 text-accent">Founder & Curator</p>
                <h3 className="text-3xl font-headline font-bold">Neha Sharma</h3>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/20 -z-10 blur-3xl opacity-50" />
      </section>

      {/* The Jaipur Heritage Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-accent">Our Roots</span>
            <h2 className="text-4xl md:text-6xl font-headline font-bold uppercase tracking-wider">Jaipur to the <span className="text-primary italic">World</span></h2>
            <div className="h-1 w-24 bg-accent/40 rounded-full mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center text-left">
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Founded in the heart of the Pink City, Jaipur, Pehnava by Neha was born out of a deep-seated love for South Asian craftsmanship. Our studio is more than just a boutique; it's a bridge between centuries-old textile traditions and the dynamic lifestyle of today's woman.
              </p>
              <p>
                Every piece in our collection is a testament to the artisans who carry the legacy of hand-blocking, intricate zari work, and the delicate art of hand-painted textiles. We handpick every fabric, ensuring that quality and comfort are never compromised for style.
              </p>
            </div>
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl">
              <Image 
                src={PlaceHolderImages.find(i => i.id === 'craftsmanship')?.imageUrl || ''} 
                alt="Traditional craftsmanship" 
                fill 
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Stats */}
      <section className="bg-secondary/10 py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto">
            {[
              { label: 'Artisans Empowered', value: '150+', icon: MapPin },
              { label: 'Happy Customers', value: '10K+', icon: Heart },
              { label: 'Authentic Designs', value: '500+', icon: Star },
              { label: 'Secure Deliveries', value: '100%', icon: ShieldCheck },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center space-y-3"
              >
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                  <stat.icon className="h-6 w-6" />
                </div>
                <h4 className="text-3xl font-headline font-bold text-primary">{stat.value}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Personal Note */}
      <section className="container mx-auto px-4 py-32 text-center">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="relative inline-block">
             <div className="absolute -top-6 -left-6 text-primary/10 text-9xl font-headline font-bold">"</div>
             <p className="text-2xl md:text-4xl font-headline italic leading-relaxed text-muted-foreground relative z-10">
              "Pehnava is not just about clothes; it's about the confidence that comes from wearing something that has a soul. We want every woman who wears our label to feel seen, celebrated, and deeply connected to her heritage."
             </p>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-primary font-headline">Neha Sharma</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent">Founder, Pehnava by Neha</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white text-center space-y-8 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-headline font-bold">Become part of <br /> the story.</h2>
            <p className="text-white/60 max-w-xl mx-auto">Join our community of style enthusiasts and heritage lovers.</p>
            <Button asChild className="rounded-full bg-accent hover:bg-accent/90 text-white font-bold h-14 px-12 uppercase text-xs tracking-widest transition-transform hover:scale-105">
              <Link href="/account/login">Join The Boutique</Link>
            </Button>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        </div>
      </section>
    </div>
  );
}
