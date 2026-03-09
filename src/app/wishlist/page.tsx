"use client";

import Link from "next/link";
import { Heart, ShoppingBag, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/context/WishlistContext";
import { ProductCard } from "@/components/store/ProductCard";
import { ALL_PRODUCTS } from "@/lib/store-data";

export default function WishlistPage() {
  const { items, itemCount } = useWishlist();

  // Recommendations for empty state or bottom section
  const recommendations = ALL_PRODUCTS.filter(p => p.isBestseller).slice(0, 4);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Page Header */}
      <section className="bg-secondary/20 py-12 md:py-20 border-b">
        <div className="container mx-auto px-4 text-center space-y-4">
          <nav className="flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="opacity-30">/</span>
            <span className="text-primary">Wishlist</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-headline font-bold uppercase tracking-wider">
            Your Favorites
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-base">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} saved for later
          </p>
          <div className="h-1 w-24 bg-accent/40 rounded-full mx-auto" />
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-8 text-center max-w-5xl mx-auto">
            <div className="relative">
              <div className="h-24 w-24 bg-secondary rounded-full flex items-center justify-center animate-pulse">
                <Heart className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="absolute -top-1 -right-1 h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Star className="h-4 w-4 text-white fill-current" />
              </div>
            </div>
            
            <div className="space-y-3 max-w-lg">
              <h2 className="text-2xl font-headline font-bold uppercase tracking-tight">Your wishlist is empty</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Save your favorite pieces from "Pehnava by Neha" to keep track of what you love. 
                Discover our latest collections and find something truly special.
              </p>
            </div>

            <Button asChild size="lg" className="rounded-full px-12 h-14 font-bold uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-transform">
              <Link href="/collections/new-arrivals">Start Exploring</Link>
            </Button>

            {/* Trending Now Section (Empty State) */}
            <div className="pt-24 w-full">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent mb-12 text-center">Trending Now</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">
                {recommendations.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
              {items.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            <div className="pt-20 border-t">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-secondary/10 p-8 md:p-12 rounded-3xl">
                <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-2xl font-headline font-bold uppercase">Ready to Checkout?</h2>
                  <p className="text-muted-foreground text-sm">Move your favorites to your bag and start your story.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                  <Button asChild variant="outline" className="rounded-full px-8 h-12 font-bold uppercase text-[10px] tracking-widest border-primary text-primary w-full sm:w-auto">
                    <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
                  </Button>
                  <Button asChild className="rounded-full px-8 h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg w-full sm:w-auto">
                    <Link href="/checkout">Go to Cart <ShoppingBag className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Boutique Note */}
      <section className="container mx-auto px-4 py-20 mt-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-accent">Curated with Heart</span>
          <p className="font-headline text-2xl md:text-3xl italic text-muted-foreground leading-relaxed">
            "Clothing is not just fabric; it's a celebration of your heritage and your future. We are honored to be part of your story."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">— Neha</p>
        </div>
      </section>
    </div>
  );
}
