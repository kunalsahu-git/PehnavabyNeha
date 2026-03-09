
'use client';

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Truck, RefreshCw, MessageSquare, ShieldCheck, Minus, Plus, ShoppingBag, RotateCcw, Banknote, Lock, MapPin, Instagram, Play } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

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
  { id: '4', slug: 'emerald-fusion-jumpsuit', name: 'Emerald Green Fusion Jumpsuit', category: 'Fusion', price: 2999, image: PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '', isNew: true },
  { id: '5', slug: 'pearl-choker-set', name: 'Pearl & Stone Choker Set', category: 'Jewellery', price: 1599, originalPrice: 2299, image: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '', isNew: true },
  { id: '6', slug: 'ivory-anarkali', name: 'Ivory Hand-painted Anarkali', category: 'Ethnic Sets', price: 5499, image: PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '', isBestseller: true },
];

const SALE_PRODUCTS = [
  { id: '3', slug: 'pastel-pink-lehanga', name: 'Pastel Pink Zari Lehanga', category: 'Ethnic Sets', price: 8999, originalPrice: 12999, image: PlaceHolderImages.find(i => i.id === 'product-3')?.imageUrl || '', isSale: true },
  { id: '8', slug: 'kundan-jhumkas', name: 'Premium Kundan Pearl Jhumkas', category: 'Jewellery', price: 1299, originalPrice: 1999, image: PlaceHolderImages.find(i => i.id === 'hero-3')?.imageUrl || '', isSale: true },
  { id: '1', slug: 'crimson-silk-saree', name: 'Crimson Embroidered Silk Saree', category: 'Sarees', price: 4999, originalPrice: 6999, image: PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '', isSale: true },
  { id: '5', slug: 'pearl-choker-set', name: 'Pearl & Stone Choker Set', category: 'Jewellery', price: 1599, originalPrice: 2299, image: PlaceHolderImages.find(i => i.id === 'cat-accessories')?.imageUrl || '', isSale: true },
];

const REELS = [
  { id: 1, title: 'Boutique BTS', tag: '#StudioVibes', image: PlaceHolderImages.find(i => i.id === 'reel-1') },
  { id: 2, title: 'Styling the Silk', tag: '#NehaStyles', image: PlaceHolderImages.find(i => i.id === 'reel-3') },
  { id: 3, title: 'Happy Customer', tag: '#PehnavaFamily', image: PlaceHolderImages.find(i => i.id === 'reel-2') },
  { id: 4, title: 'Jaipur Diaries', tag: '#Heritage', image: PlaceHolderImages.find(i => i.id === 'cat-ethnic') },
  { id: 5, title: 'Fusion Friday', tag: '#ModernEthnic', image: PlaceHolderImages.find(i => i.id === 'reel-1') },
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

const FEATURED_PRODUCT = {
  id: 'fp-1',
  slug: 'jaipur-motif-print-dress',
  brand: 'Pehnava - She is Special',
  name: 'Women Hand-Blocked Jaipur Motif Print Dress',
  price: 2499,
  originalPrice: 4999,
  discount: 'SAVE 50%',
  colors: ['Off White', 'Soft Pink'],
  sizes: ['XS/36', 'S/38', 'M/40', 'L/42', 'XL/44'],
  images: [
    PlaceHolderImages.find(i => i.id === 'cat-western')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'product-4')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'hero-1')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'cat-ethnic')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'product-2')?.imageUrl || '',
    PlaceHolderImages.find(i => i.id === 'product-1')?.imageUrl || '',
  ]
};

export default function Home() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const { addItem } = useCart();

  // Featured Product State
  const [selectedSize, setSelectedSize] = useState('M/40');
  const [selectedColor, setSelectedColor] = useState('Off White');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const autoplayHero = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const autoplayArrivals = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false })
  );

  const autoplaySale = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const handleFeaturedAddToCart = () => {
    addItem({
      id: FEATURED_PRODUCT.id,
      name: FEATURED_PRODUCT.name,
      price: FEATURED_PRODUCT.price,
      image: FEATURED_PRODUCT.images[0],
      quantity: quantity,
      size: selectedSize,
      color: selectedColor
    });
  };

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Banner Section */}
      <section className="relative h-[45vh] md:h-[50vh] w-full bg-secondary overflow-hidden">
        <Carousel 
          setApi={setApi}
          opts={{ loop: true }} 
          plugins={[autoplayHero.current]}
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
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                  
                  <div className="relative z-10 text-center text-white px-4 max-w-4xl space-y-3 md:space-y-4">
                    <span className="text-xs font-bold tracking-[0.4em] uppercase opacity-90 animate-in fade-in slide-in-from-bottom-2 duration-700">
                      {slide.tag}
                    </span>
                    <h1 className="text-3xl md:text-6xl font-headline font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                      {slide.title}
                    </h1>
                    <p className="text-sm md:text-lg font-light max-w-xl mx-auto opacity-95 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400 line-clamp-2">
                      {slide.description}
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                      <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 md:h-12 px-8 rounded-full font-bold w-full sm:w-auto shadow-xl">
                        Shop Now
                      </Button>
                      <Button size="lg" variant="outline" className="border-2 border-white text-white bg-white/10 hover:bg-white hover:text-primary h-11 md:h-12 px-8 rounded-full w-full sm:w-auto backdrop-blur-sm transition-all shadow-xl font-bold">
                        View Lookbook
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
            <CarouselPrevious className="static translate-y-0 h-10 w-10 border-2 border-white/40 text-white bg-black/30 hover:bg-black/60 backdrop-blur-md pointer-events-auto" />
            <CarouselNext className="static translate-y-0 h-10 w-10 border-2 border-white/40 text-white bg-black/30 hover:bg-black/60 backdrop-blur-md pointer-events-auto" />
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-30">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  current === i ? "bg-white w-8 shadow-lg" : "bg-white/30 w-1.5"
                )}
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </section>

      {/* Studio Stories Section (Instagram Reel Style) */}
      <section className="bg-white py-16 md:py-24 border-b overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3 text-primary">
                <Instagram className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Follow @PehnavaByNeha</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold uppercase">Studio Stories</h2>
            </div>
            <Button variant="outline" className="rounded-full border-primary text-primary font-bold gap-2">
              <Instagram className="h-4 w-4" /> Visit Instagram
            </Button>
          </div>

          <div className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-8 px-1">
            {REELS.map((reel) => (
              <motion.div 
                key={reel.id}
                whileHover={{ y: -5 }}
                className="relative flex-shrink-0 w-[200px] md:w-[260px] aspect-[9/16] rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
              >
                <Image 
                  src={reel.image?.imageUrl || ''} 
                  alt={reel.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  data-ai-hint={reel.image?.imageHint}
                />
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
            ))}
          </div>
        </div>
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

      {/* Sale Section - Infinite Auto Scroll */}
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
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[autoplaySale.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-4 md:-ml-6">
              {SALE_PRODUCTS.map((product) => (
                <CarouselItem key={product.id} className="pl-4 md:pl-6 basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <ProductCard {...product} />
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

      {/* Featured Product Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-headline font-bold tracking-widest uppercase">Featured Product</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-6xl mx-auto">
            <div className="space-y-4 max-w-md mx-auto lg:mx-0 w-full">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-secondary/20 shadow-xl">
                <Image
                  src={FEATURED_PRODUCT.images[activeImageIndex]}
                  alt={FEATURED_PRODUCT.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {FEATURED_PRODUCT.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                      activeImageIndex === idx ? "border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-8">
              <div className="space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{FEATURED_PRODUCT.brand}</span>
                <h3 className="text-3xl md:text-4xl font-headline font-bold leading-tight">{FEATURED_PRODUCT.name}</h3>
                
                <div className="flex items-center gap-4">
                  <span className="text-destructive font-bold text-xs bg-destructive/10 px-2 py-1 rounded">{FEATURED_PRODUCT.discount}</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-primary">₹{FEATURED_PRODUCT.price.toLocaleString()}</span>
                  <span className="text-lg text-muted-foreground line-through">₹{FEATURED_PRODUCT.originalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Size:</label>
                  <div className="flex flex-wrap gap-2">
                    {FEATURED_PRODUCT.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "min-w-12 h-10 px-3 flex items-center justify-center rounded border text-xs font-medium transition-all",
                          selectedSize === size ? "bg-primary text-white border-primary" : "border-border hover:border-primary/50"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color: {selectedColor}</label>
                  <div className="flex gap-3">
                    {FEATURED_PRODUCT.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-8 h-8 rounded border-2 p-0.5 transition-all",
                          selectedColor === color ? "border-primary" : "border-border"
                        )}
                      >
                        <div className={cn(
                          "w-full h-full rounded-sm",
                          color === 'Off White' ? "bg-[#FDFBF7]" : "bg-pink-200"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center rounded-full border border-border h-12 px-2">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 rounded-full">
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 rounded-full">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleFeaturedAddToCart}
                    className="flex-1 h-12 bg-white text-primary border-primary hover:bg-primary/5 border-2 font-bold rounded-full"
                  >
                    ADD TO CART
                  </Button>
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
                  { icon: MapPin, label: 'Made In India' }
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
