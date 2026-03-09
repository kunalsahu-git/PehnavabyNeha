'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Truck, RefreshCw, MessageSquare, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Ethnic Sets", image: PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageUrl || '', hint: PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageHint || '', href: "/collections/ethnic-wear" },
  { name: "Sarees", image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', hint: PlaceHolderImages.find(i => i.id === 'product-1')?.imageHint || '', href: "/collections/sarees" },
  { name: "Dresses", image: PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '', hint: PlaceHolderImages.find(i => i.id === 'cat-western')?.imageHint || '', href: "/collections/western-fusion" },
  { name: "Jewellery", image: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '', hint: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageHint || '', href: "/collections/jewellery" },
  { name: "Sale", image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', hint: PlaceHolderImages.find(i => i.id === 'product-3')?.imageHint || '', href: "/collections/sale" },
];

const NEW_ARRIVALS = [
  { id: '1', slug: 'crimson-silk-saree', name: 'Crimson Embroidered Silk Saree', category: 'Sarees', price: 4999, originalPrice: 6999, image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', isNew: true },
  { id: '2', slug: 'gold-motif-kurta', name: 'Gold Floral Motif Kurta Set', category: 'Ethnic Sets', price: 3499, originalPrice: 4499, image: PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '', isBestseller: true },
  { id: '3', slug: 'pastel-pink-lehanga', name: 'Pastel Pink Zari Lehanga', category: 'Ethnic Sets', price: 8999, originalPrice: 12999, image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', isSale: true },
  { id: '4', slug: 'emerald-fusion-jumpsuit', name: 'Emerald Green Fusion Jumpsuit', category: 'Fusion', price: 2999, image: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', isNew: true },
];

const HERO_SLIDES = [
  {
    id: 1,
    title: 'Elegance Redefined',
    description: 'Discover curated pieces that celebrate the modern woman\'s heritage.',
    image: PlaceHolderImages.find(i => i.id === 'hero-1'),
    tag: 'Collection 2024'
  },
  {
    id: 2,
    title: 'The Wedding Edit',
    description: 'Exquisite bridal and occasion wear for your most special moments.',
    image: PlaceHolderImages.find(i => i.id === 'hero-2'),
    tag: 'Collection 2024'
  },
  {
    id: 3,
    title: 'Luxury in Every Stitch',
    description: 'Timeless designs meet modern craftsmanship in our premium collection.',
    image: PlaceHolderImages.find(i => i.id === 'hero-3'),
    tag: 'Collection 2024'
  },
];

export default function Home() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Banner Section */}
      <section className="relative h-[80vh] md:h-[90vh] w-full bg-secondary overflow-hidden">
        <Carousel 
          setApi={setApi}
          opts={{ loop: true }} 
          className="h-full w-full"
        >
          <CarouselContent className="h-full ml-0">
            {HERO_SLIDES.map((slide) => (
              <CarouselItem key={slide.id} className="h-full p-0">
                <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
                  <Image
                    src={slide.image?.imageUrl || ''}
                    alt={slide.title}
                    fill
                    className="object-cover brightness-[0.65]"
                    priority={slide.id === 1}
                    data-ai-hint={slide.image?.imageHint}
                  />
                  {/* Premium Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                  
                  <div className="relative z-10 text-center text-white px-4 max-w-4xl space-y-6">
                    <span className="text-sm font-bold tracking-[0.4em] uppercase opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                      {slide.tag}
                    </span>
                    <h1 className="text-5xl md:text-8xl font-headline font-bold leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                      {slide.title}
                    </h1>
                    <p className="text-lg md:text-2xl font-light max-w-2xl mx-auto opacity-95 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
                      {slide.description}
                    </p>
                    <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-700">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 text-lg rounded-full font-bold w-full sm:w-auto shadow-2xl transition-all border-none">
                        Shop Now
                      </Button>
                      <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-primary h-14 px-10 text-lg rounded-full w-full sm:w-auto backdrop-blur-sm transition-all shadow-2xl font-bold">
                        View Lookbook
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Side Navigation Buttons */}
          <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
            <CarouselPrevious className="static translate-y-0 h-12 w-12 border-2 border-white/40 text-white bg-black/30 hover:bg-black/60 backdrop-blur-md pointer-events-auto" />
            <CarouselNext className="static translate-y-0 h-12 w-12 border-2 border-white/40 text-white bg-black/30 hover:bg-black/60 backdrop-blur-md pointer-events-auto" />
          </div>

          {/* Dot Navigation Indicators */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-30">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  current === i ? "bg-white w-10 shadow-lg" : "bg-white/30 w-3"
                )}
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </section>

      {/* Category Grid Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-5xl font-headline font-bold">Shop by Category</h2>
          <div className="h-1 w-20 bg-accent rounded-full"></div>
          <p className="text-muted-foreground max-w-xl">Curated collections for every occasion and style preference.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
          {CATEGORIES.map((cat) => (
            <Link key={cat.name} href={cat.href} className="group relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint={cat.hint}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-headline text-2xl font-semibold whitespace-nowrap">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="bg-secondary/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-headline font-bold">New Arrivals</h2>
              <p className="text-muted-foreground">The latest trends fresh from our boutique.</p>
            </div>
            <Link href="/collections/new-arrivals" className="hidden md:flex items-center text-primary font-bold hover:underline">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {NEW_ARRIVALS.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
          <div className="mt-12 flex md:hidden justify-center">
             <Button variant="outline" asChild className="rounded-full px-8">
               <Link href="/collections/new-arrivals">View All Products</Link>
             </Button>
          </div>
        </div>
      </section>

      {/* Shop the Look / Editorial */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center mb-16 space-y-3">
          <span className="text-primary font-bold uppercase tracking-widest text-sm">Editorial</span>
          <h2 className="text-3xl md:text-5xl font-headline font-bold">Shop the Look</h2>
          <p className="text-muted-foreground max-w-xl">Get inspired by our curated ensembles for the modern South Asian woman.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-2xl cursor-pointer">
              <Image
                src={PlaceHolderImages[i + 4].imageUrl}
                alt="Shop the look"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                data-ai-hint={PlaceHolderImages[i + 4].imageHint}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <h3 className="text-3xl font-headline font-bold mb-4">Midnight Soiree</h3>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary rounded-full px-8">
                  Shop Outfit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <section className="border-y bg-background py-12">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <Truck className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Free Delivery</h4>
            <p className="text-xs text-muted-foreground">On orders above ₹2999</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <RefreshCw className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Easy Returns</h4>
            <p className="text-xs text-muted-foreground">Within 7 days of delivery</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">WhatsApp Support</h4>
            <p className="text-xs text-muted-foreground">Instant help via chat</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h4 className="font-bold text-sm uppercase tracking-wider">Secure Payment</h4>
            <p className="text-xs text-muted-foreground">Verified UPI Scan & Pay</p>
          </div>
        </div>
      </section>
    </div>
  );
}
