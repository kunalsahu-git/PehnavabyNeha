'use client';

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Truck, RefreshCw, MessageSquare, ShieldCheck,
  Minus, Plus, RotateCcw, Banknote, Lock, MapPin, Instagram, Play, X, Loader2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import {
  Carousel, CarouselContent, CarouselItem,
  CarouselNext, CarouselPrevious, type CarouselApi,
} from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { getAllCategoriesQuery, type CategoryData } from "@/firebase/firestore/categories";
import { getNewArrivalsQuery, getSaleProductsQuery, type ProductData } from "@/firebase/firestore/products";
import { normalizeColor, colorToCSS, isLightColor } from "@/lib/colors";
import { getPublishedHeroSlidesQuery, type HeroSlideData } from "@/firebase/firestore/hero_slides";
import { getPublishedStudioReelsQuery, type StudioReelData } from "@/firebase/firestore/studio_reels";

// ── STATIC DATA — sections with no backend yet ────────────────────────────────
// TODO: Hero Carousel — build a "HeroSlides" collection in Firestore to make these editable
const HERO_SLIDES = [
  {
    id: 1, title: 'Elegance Redefined',
    description: "Discover curated pieces that celebrate the modern woman's heritage.",
    image: PlaceHolderImages.find(i => i.id === 'hero-1'),
    tag: 'Collection 2025', href: '/shop',
  },
  {
    id: 2, title: 'The Wedding Edit',
    description: 'Exquisite bridal and occasion wear for your most special moments.',
    image: PlaceHolderImages.find(i => i.id === 'hero-2'),
    tag: 'Bridal 2025', href: '/collections/bridal-edit-2025',
  },
  {
    id: 3, title: 'Luxury in Every Stitch',
    description: 'Timeless designs meet modern craftsmanship in our premium collection.',
    image: PlaceHolderImages.find(i => i.id === 'hero-3'),
    tag: 'Festive Glow', href: '/collections/festive-glow',
  },
];

// TODO: Featured Product — build a "featured_product" config doc in Firestore
const FEATURED_PRODUCT = {
  id: 'fp-1', slug: 'jaipur-motif-print-dress',
  brand: 'Pehnava - She is Special',
  name: 'Women Hand-Blocked Jaipur Motif Print Dress',
  price: 2499, originalPrice: 4999, discount: 'SAVE 50%',
  colors: ['Off White', 'Soft Pink'],
  sizes: ['XS/36', 'S/38', 'M/40', 'L/42', 'XL/44'],
  images: [
    PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '',
  ],
};

// TODO: Studio Stories — build a "studio_reels" collection in Firestore
const REELS = [
  { id: 1, title: 'Boutique BTS', tag: '#StudioVibes', image: PlaceHolderImages.find(i => i.id === 'reel-1'), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { id: 2, title: 'Styling the Silk', tag: '#NehaStyles', image: PlaceHolderImages.find(i => i.id === 'reel-3'), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { id: 3, title: 'Happy Customer', tag: '#PehnavaFamily', image: PlaceHolderImages.find(i => i.id === 'reel-2'), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { id: 4, title: 'Jaipur Diaries', tag: '#Heritage', image: PlaceHolderImages.find(i => i.id === 'cat-ethnic'), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
  { id: 5, title: 'Fusion Friday', tag: '#ModernEthnic', image: PlaceHolderImages.find(i => i.id === 'reel-1'), videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
];

// Static fallback for categories grid — used while Firestore loads or if empty
const FALLBACK_CATEGORIES = [
  { name: 'Sarees', slug: 'sarees', imageUrl: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '' },
  { name: 'Lehengas', slug: 'lehengas', imageUrl: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '' },
  { name: 'Ethnic Sets', slug: 'ethnic-sets', imageUrl: PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageUrl || '' },
  { name: 'Accessories', slug: 'accessories', imageUrl: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '' },
  { name: 'Indo-Western', slug: 'indo-western', imageUrl: PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '' },
];

// Static fallback for new arrivals — used if Firestore query returns empty
const FALLBACK_NEW_ARRIVALS = [
  { id: '1', slug: 'crimson-silk-saree', name: 'Crimson Embroidered Silk Saree', category: 'Sarees', categorySlug: 'sarees', price: 4999, originalPrice: 6999, image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', isNew: true },
  { id: '2', slug: 'gold-motif-kurta', name: 'Gold Floral Motif Kurta Set', category: 'Ethnic Sets', categorySlug: 'ethnic-sets', price: 3499, originalPrice: 4499, image: PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '', isBestseller: true },
  { id: '4', slug: 'emerald-fusion-jumpsuit', name: 'Emerald Green Fusion Jumpsuit', category: 'Indo-Western', categorySlug: 'indo-western', price: 2999, image: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', isNew: true },
  { id: '5', slug: 'pearl-choker-set', name: 'Pearl & Stone Choker Set', category: 'Accessories', categorySlug: 'accessories', price: 1599, originalPrice: 2299, image: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '', isNew: true },
  { id: '6', slug: 'ivory-anarkali', name: 'Ivory Hand-painted Anarkali', category: 'Anarkalis', categorySlug: 'anarkalis', price: 5499, image: PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '', isBestseller: true },
];

// Static fallback for sale products
const FALLBACK_SALE = [
  { id: '3', slug: 'pastel-pink-lehanga', name: 'Pastel Pink Zari Lehenga', category: 'Lehengas', categorySlug: 'lehengas', price: 8999, originalPrice: 12999, image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', isSale: true },
  { id: '8', slug: 'kundan-jhumkas', name: 'Premium Kundan Pearl Jhumkas', category: 'Accessories', categorySlug: 'accessories', price: 1299, originalPrice: 1999, image: PlaceHolderImages.find(i => i.id === 'hero-3')?.imageUrl || '', isSale: true },
  { id: '1', slug: 'crimson-silk-saree', name: 'Crimson Embroidered Silk Saree', category: 'Sarees', categorySlug: 'sarees', price: 4999, originalPrice: 6999, image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', isSale: true },
];
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const { addItem } = useCart();
  const db = useFirestore();

  // Featured product state (STATIC)
  const [selectedSize, setSelectedSize] = useState('M/40');
  const [selectedColor, setSelectedColor] = useState('Off White');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ── LIVE FIRESTORE DATA ───────────────────────────────────────────────────
  const categoriesQuery = useMemoFirebase(() => db ? getAllCategoriesQuery(db) : null, [db]);
  const { data: allCategories } = useCollection<CategoryData>(categoriesQuery);
  const publishedCategories = (allCategories ?? []).filter(c => c.published);

  const newArrivalsQuery = useMemoFirebase(() => db ? getNewArrivalsQuery(db) : null, [db]);
  const { data: newArrivalsData } = useCollection<ProductData>(newArrivalsQuery);

  const saleQuery = useMemoFirebase(() => db ? getSaleProductsQuery(db) : null, [db]);
  const { data: saleData } = useCollection<ProductData>(saleQuery);

  // Hero slides
  const heroSlidesQuery = useMemoFirebase(() => db ? query(collection(db, 'hero_slides'), where('published', '==', true)) : null, [db]);
  const { data: heroSlidesData } = useCollection<HeroSlideData>(heroSlidesQuery);

  // Studio reels
  const reelsQuery = useMemoFirebase(() => db ? getPublishedStudioReelsQuery(db) : null, [db]);
  const { data: reelsData } = useCollection<StudioReelData>(reelsQuery);

  // Featured product — load config doc, then fetch product by stable doc ID
  const featuredConfigRef = useMemoFirebase(
    () => db ? doc(db, 'configs', 'featured_product') : null,
    [db]
  );
  const { data: featuredConfig } = useDoc(featuredConfigRef);
  const featuredProductRef = useMemoFirebase(
    () => db && featuredConfig?.productId ? doc(db, 'products', featuredConfig.productId) : null,
    [db, featuredConfig?.productId]
  );
  const { data: featuredProductDoc } = useDoc<ProductData>(featuredProductRef);
  const firestoreFeaturedProduct = featuredProductDoc?.published !== false ? featuredProductDoc : null;

  // Filter published client-side (queries no longer include compound where('published') clause)
  const publishedNewArrivals = (newArrivalsData ?? []).filter(p => p.published !== false);
  const publishedSale = (saleData ?? []).filter(p => p.published !== false);

  // Use Firestore data if available, otherwise fallback to static
  const categoryGrid = publishedCategories.length > 0 ? publishedCategories : FALLBACK_CATEGORIES;
  const newArrivals = publishedNewArrivals.length > 0 ? publishedNewArrivals : FALLBACK_NEW_ARRIVALS;
  const saleProducts = publishedSale.length > 0 ? publishedSale : FALLBACK_SALE;
  
  const heroSlides = (heroSlidesData ?? []).length > 0 
    ? [...heroSlidesData!].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) 
    : HERO_SLIDES;
  const reels = (reelsData ?? []).length > 0 ? reelsData! : REELS;
  // Featured product — merge Firestore fields into FEATURED_PRODUCT shape for the existing JSX
  const fp = firestoreFeaturedProduct
    ? {
        id: (firestoreFeaturedProduct as any).id ?? FEATURED_PRODUCT.id,
        slug: firestoreFeaturedProduct.slug,
        brand: 'Pehnava by Neha',
        name: featuredConfig?.headline || firestoreFeaturedProduct.name,
        price: firestoreFeaturedProduct.price,
        originalPrice: firestoreFeaturedProduct.originalPrice ?? 0,
        discount: firestoreFeaturedProduct.originalPrice
          ? `SAVE ${Math.round((1 - firestoreFeaturedProduct.price / firestoreFeaturedProduct.originalPrice) * 100)}%`
          : '',
        colors: firestoreFeaturedProduct.colors ?? FEATURED_PRODUCT.colors,
        sizes: firestoreFeaturedProduct.sizes ?? FEATURED_PRODUCT.sizes,
        images: firestoreFeaturedProduct.images?.length
          ? firestoreFeaturedProduct.images
          : [firestoreFeaturedProduct.image, ...FEATURED_PRODUCT.images].filter(Boolean),
      }
    : FEATURED_PRODUCT;
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(true);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const autoplayHero = useRef(Autoplay({ delay: 5000, stopOnInteraction: false }));
  const autoplayArrivals = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const autoplaySale = useRef(Autoplay({ delay: 4000, stopOnInteraction: false }));

  // Handle Hero Autoplay logic based on video
  useEffect(() => {
    if (!api) return;
    
    const currentSlide = heroSlides[current];
    const isVideoSlide = !!(currentSlide as any).videoUrl;

    if (isVideoSlide) {
      // Pause carousel autoplay if it's a video slide
      autoplayHero.current.stop();
      
      const video = videoRefs.current[current];
      if (video) {
        if (isHeroVideoPlaying) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    } else {
      // Resume carousel autoplay for image slides
      autoplayHero.current.reset();
      autoplayHero.current.play();
    }
  }, [api, current, isHeroVideoPlaying, heroSlides]);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrent(newIndex);
      // When sliding to a new video, ensure it's "playing" mode by default
      setIsHeroVideoPlaying(true);
    });
  }, [api]);

  useEffect(() => {
    if (playingVideoUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [playingVideoUrl]);

  const handleFeaturedAddToCart = () => {
    addItem({
      id: fp.id, name: fp.name,
      price: fp.price, image: fp.images[0],
      quantity, size: selectedSize, color: selectedColor,
    });
  };

  return (
    <div className="flex flex-col w-full overflow-hidden">

      {/* ── Hero Carousel ─────────────────────────────────────────────────── */}
      <section className="relative h-[55vh] md:h-[70vh] w-full bg-secondary overflow-hidden">
        <Carousel setApi={setApi} opts={{ loop: true }} plugins={[autoplayHero.current]} className="h-full w-full">
          <CarouselContent className="h-full ml-0">
            {heroSlides.map((slide, idx) => {
              const imgUrl = (slide as any).imageUrl || (slide as any).image?.imageUrl || '';
              const videoUrl = (slide as any).videoUrl || null;
              const slideHref = (slide as any).href || '/collections/new-arrivals';
              const ctaLabel = (slide as any).ctaLabel || 'Shop Now';
              const isCurrent = current === idx;

              return (
                <CarouselItem key={(slide as any).id ?? idx} className="h-full p-0">
                  <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-black">
                    {videoUrl ? (
                      <video 
                        ref={el => { videoRefs.current[idx] = el; }}
                        src={videoUrl}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-1000"
                        autoPlay
                        muted
                        playsInline
                        loop={false}
                        onEnded={() => {
                          if (isCurrent) api?.scrollNext();
                        }}
                      />
                    ) : (
                      <Image 
                        src={imgUrl} 
                        alt={slide.title} 
                        fill 
                        className="object-cover brightness-[0.65] transition-transform duration-[10s] ease-linear group-hover:scale-110" 
                        priority={idx === 0} 
                      />
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                    
                    <div className="relative z-10 text-center text-white px-4 max-w-4xl space-y-4 md:space-y-6">
                      <motion.span 
                        initial={{ opacity: 0, y: 20 }}
                        animate={isCurrent ? { opacity: 0.9, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase"
                      >
                        {slide.tag}
                      </motion.span>
                      
                      <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={isCurrent ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-7xl font-headline font-bold leading-[1.1] tracking-tight"
                      >
                        {slide.title}
                      </motion.h1>
                      
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={isCurrent ? { opacity: 0.95, y: 0 } : {}}
                        transition={{ delay: 0.6 }}
                        className="text-sm md:text-xl font-light max-w-xl mx-auto opacity-95 line-clamp-2 leading-relaxed"
                      >
                        {slide.description}
                      </motion.p>
                      
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={isCurrent ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.8 }}
                        className="pt-6 flex flex-row items-center justify-center gap-3"
                      >
                        <Button asChild className="bg-white text-primary hover:bg-white/90 h-10 md:h-14 px-6 md:px-10 text-xs md:text-sm rounded-full font-bold shadow-2xl transition-all hover:scale-105 active:scale-95">
                          <Link href={slideHref}>{ctaLabel}</Link>
                        </Button>
                        <Button variant="outline" asChild className="border-2 border-white/30 text-white bg-white/5 hover:bg-white hover:text-primary h-10 md:h-14 px-6 md:px-10 text-xs md:text-sm rounded-full backdrop-blur-md shadow-xl font-bold transition-all hover:border-white">
                          <Link href="/collections/new-arrivals">View Lookbook</Link>
                        </Button>
                      </motion.div>
                    </div>

                    {/* Video Controls Toggle */}
                    {videoUrl && isCurrent && (
                      <div className="absolute bottom-10 right-10 z-30 flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setIsHeroVideoPlaying(!isHeroVideoPlaying)}
                          className="h-12 w-12 rounded-full border-white/20 bg-black/20 text-white backdrop-blur-md hover:bg-white hover:text-black transition-all"
                        >
                          {isHeroVideoPlaying ? <Minus className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                        </Button>
                        <div className="hidden md:block text-[10px] font-bold text-white uppercase tracking-widest opacity-60">
                          {isHeroVideoPlaying ? 'Playing' : 'Paused'}
                        </div>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <div className="absolute inset-y-0 left-6 right-6 flex items-center justify-between pointer-events-none z-20">
            <CarouselPrevious className="static translate-y-0 h-12 w-12 border-white/20 text-white bg-black/10 hover:bg-white hover:text-black backdrop-blur-md pointer-events-auto transition-all" />
            <CarouselNext className="static translate-y-0 h-12 w-12 border-white/20 text-white bg-black/10 hover:bg-white hover:text-black backdrop-blur-md pointer-events-auto transition-all" />
          </div>
          <div className="absolute bottom-10 left-10 flex flex-col gap-4 z-30">
            <div className="flex gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <button key={i} onClick={() => api?.scrollTo(i)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500", 
                    current === i ? "bg-white w-12 shadow-lg" : "bg-white/20 w-4 hover:bg-white/40"
                  )} 
                />
              ))}
            </div>
          </div>
        </Carousel>
      </section>

      {/* ── Shop by Category — LIVE from Firestore (fallback: FALLBACK_CATEGORIES) */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center mb-12 space-y-3">
          <h2 className="text-3xl md:text-5xl font-headline font-bold">Shop by Category</h2>
          <div className="h-1 w-20 bg-accent rounded-full" />
          <p className="text-muted-foreground max-w-xl">Curated collections for every occasion and style preference.</p>
        </div>
        <div className={cn(
          "grid gap-4 md:gap-8",
          categoryGrid.length <= 4 ? "grid-cols-2 md:grid-cols-4" :
          categoryGrid.length === 5 ? "grid-cols-2 md:grid-cols-5" :
          "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        )}>
          {categoryGrid.slice(0, 8).map(cat => (
            <Link key={cat.slug} href={`/collections/${cat.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={cat.imageUrl || `https://picsum.photos/seed/${cat.slug}/400/500`}
                alt={cat.name} fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-headline text-xl md:text-2xl font-semibold whitespace-nowrap text-center px-2">
                {cat.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New Arrivals — LIVE from Firestore (fallback: FALLBACK_NEW_ARRIVALS) */}
      <section className="bg-secondary/10 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-headline font-bold">New Arrivals</h2>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Fresh from our Jaipur Studio</p>
            </div>
            <Button asChild variant="link" className="text-primary font-bold">
              <Link href="/collections/new-arrivals" className="flex items-center">
                Explore All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Carousel opts={{ align: "start", loop: true }} plugins={[autoplayArrivals.current]} className="w-full">
            <CarouselContent className="-ml-4 md:-ml-6">
              {newArrivals.map((product, i) => (
                <CarouselItem key={'id' in product ? product.id : i} className="pl-4 md:pl-6 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard {...(product as any)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center md:justify-end gap-4 mt-10">
              <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-md" />
              <CarouselNext className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-md" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* ── Special Offers — LIVE from Firestore (fallback: FALLBACK_SALE) ─────── */}
      <section className="bg-background py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-primary">Special Offers</h2>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Unbeatable prices on luxury pieces</p>
            </div>
            <Link href="/collections/sale" className="hidden md:flex items-center text-primary font-bold hover:underline">
              Shop The Sale <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <Carousel opts={{ align: "start", loop: true }} plugins={[autoplaySale.current]} className="w-full">
            <CarouselContent className="-ml-4 md:-ml-6">
              {saleProducts.map((product, i) => (
                <CarouselItem key={'id' in product ? product.id : i} className="pl-4 md:pl-6 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard {...(product as any)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center md:justify-end gap-4 mt-10">
              <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-md" />
              <CarouselNext className="static translate-y-0 h-12 w-12 rounded-full border-2 border-primary/20 hover:bg-primary hover:text-white transition-all shadow-md" />
            </div>
          </Carousel>
        </div>
      </section>

      {/* ── Featured Product — STATIC (TODO: build featured_product config in Firestore) */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-headline font-bold tracking-widest uppercase">Featured Product</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            <div className="space-y-4 max-w-md mx-auto lg:mx-0 w-full">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-secondary/20 shadow-xl">
                <Image src={fp.images[activeImageIndex] || ''} alt={fp.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {fp.images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)}
                    className={cn("relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                      activeImageIndex === idx ? "border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100")}>
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{fp.brand}</span>
                <h3 className="text-3xl md:text-4xl font-headline font-bold leading-tight">{fp.name}</h3>
                {fp.discount && (
                  <div className="flex items-center gap-4">
                    <span className="text-destructive font-bold text-xs bg-destructive/10 px-2 py-1 rounded">{fp.discount}</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-primary">₹{fp.price.toLocaleString()}</span>
                  {fp.originalPrice > 0 && (
                    <span className="text-lg text-muted-foreground line-through">₹{fp.originalPrice.toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size:</label>
                  <div className="flex flex-wrap gap-2">
                    {fp.sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={cn("min-w-12 h-10 px-3 flex items-center justify-center rounded border text-xs font-medium transition-all",
                          selectedSize === size ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50")}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Colour: <span className="text-primary">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {fp.colors.map(raw => {
                      const color = normalizeColor(raw);
                      const active = selectedColor === color.name;
                      return (
                        <button
                          key={color.name}
                          title={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={cn(
                            "relative h-9 w-9 rounded-full transition-all duration-150",
                            "ring-offset-2 focus:outline-none focus:ring-2 focus:ring-primary/50",
                            active ? "ring-2 ring-primary scale-110 shadow-md" : "hover:scale-105 hover:shadow-sm",
                            isLightColor(color.hex) && "border border-slate-300"
                          )}
                          style={{ background: colorToCSS(color.hex) }}
                        >
                          {active && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <svg viewBox="0 0 12 12" className={cn("h-3 w-3", isLightColor(color.hex) ? "text-slate-800" : "text-white")} fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="2,6 5,9 10,3" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center rounded-full border border-border h-12 px-2">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 rounded-full"><Minus className="h-3 w-3" /></Button>
                    <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 rounded-full"><Plus className="h-3 w-3" /></Button>
                  </div>
                  <Button onClick={handleFeaturedAddToCart} className="flex-1 h-12 bg-white text-primary border-primary hover:bg-primary/5 border-2 font-bold rounded-full">ADD TO CART</Button>
                </div>
                <Button className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-full flex items-center justify-center gap-3">
                  BUY NOW
                  <div className="flex items-center gap-1 opacity-80">
                    <Image src="https://placehold.co/30x18/png?text=UPI" width={30} height={18} alt="UPI" className="invert" />
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 pt-4 border-t">
                {[
                  { icon: RotateCcw, label: '15 Days Return' },
                  { icon: Banknote, label: 'Cash On Delivery' },
                  { icon: Truck, label: 'Free Shipping' },
                  { icon: ShieldCheck, label: 'Quality Guaranteed' },
                  { icon: Lock, label: 'Secure Checkout' },
                  { icon: MapPin, label: 'Made In India' },
                ].map((badge, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-2">
                    <badge.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] leading-tight text-muted-foreground font-medium uppercase tracking-tighter">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Studio Stories — STATIC (TODO: build studio_reels collection in Firestore) */}
      <section className="bg-white py-16 md:py-24 border-b overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 text-primary">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Follow @PehnavaByNeha</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold uppercase">Studio Stories</h2>
            </div>
            <Button variant="outline" className="rounded-full border-primary text-primary font-bold gap-2">
              <Instagram className="h-4 w-4" /> Visit Instagram
            </Button>
          </div>
          <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-8 px-1">
            {reels.map((reel, idx) => {
              // Support both Firestore shape (imageUrl string) and static fallback shape (image object)
              const imgUrl = (reel as any).imageUrl || (reel as any).image?.imageUrl || '';
              const igUrl = (reel as any).instagramUrl || (reel as any).videoUrl || null;
              const isVideo = !!igUrl && (igUrl.includes('.mp4') || igUrl.includes('video'));
              const card = (
                <motion.div key={(reel as any).id ?? idx} whileHover={{ y: -5 }}
                  onClick={() => {
                    if (isVideo) {
                      setIsVideoLoading(true);
                      setPlayingVideoUrl(igUrl);
                    } else if (igUrl) {
                      window.open(igUrl, '_blank');
                    }
                  }}
                  className="relative flex-shrink-0 w-[200px] md:w-[260px] aspect-[9/16] rounded-2xl overflow-hidden shadow-lg group cursor-pointer">
                  <Image src={imgUrl} alt={reel.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40">
                      <Play className="h-5 w-5 text-white fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 space-y-1">
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{reel.tag}</p>
                    <h4 className="text-white font-headline text-lg md:text-xl font-bold leading-tight">{reel.title}</h4>
                  </div>
                </motion.div>
              );
              return <React.Fragment key={(reel as any).id ?? idx}>{card}</React.Fragment>;
            })}
          </div>
        </div>
      </section>

      {/* Video Overlay Modal */}
      {playingVideoUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8 backdrop-blur-md transition-all animate-in fade-in duration-300"
          onClick={() => setPlayingVideoUrl(null)}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setPlayingVideoUrl(null); }} 
            className="absolute top-4 right-4 md:top-8 md:right-8 z-[110] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="h-6 w-6 md:h-8 md:w-8" />
          </button>
          <div 
            className="relative w-full max-w-[420px] h-full max-h-[85vh] md:max-h-[90vh] bg-black rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
              </div>
            )}
            <video 
              src={playingVideoUrl as string} 
              autoPlay 
              muted
              controls 
              playsInline 
              className="w-full h-full object-contain"
              onWaiting={() => setIsVideoLoading(true)}
              onPlaying={() => setIsVideoLoading(false)}
              onLoadedData={() => setIsVideoLoading(false)}
            />
          </div>
        </div>
      )}

      {/* ── Features Strip — STATIC (brand promise, no backend needed) ──────────── */}
      <section className="border-y bg-background py-12">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Truck, title: 'Free Delivery', sub: 'On orders above ₹2999' },
            { icon: RefreshCw, title: 'Easy Returns', sub: 'Within 7 days of delivery' },
            { icon: MessageSquare, title: 'WhatsApp Support', sub: 'Instant help via chat' },
            { icon: ShieldCheck, title: 'Secure Payment', sub: 'Verified UPI Scan & Pay' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h4 className="font-bold text-sm uppercase tracking-wider">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
