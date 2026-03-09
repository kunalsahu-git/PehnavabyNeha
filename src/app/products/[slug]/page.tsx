'use client';

import { use, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronRight, 
  Minus, 
  Plus, 
  Heart, 
  Share2, 
  RotateCcw, 
  Truck, 
  Banknote, 
  ShieldCheck,
  Lock,
  MapPin,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/accordion";
import { ALL_PRODUCTS, Product } from "@/lib/store-data";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/store/ProductCard";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const zoomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = ALL_PRODUCTS.find(p => p.slug === slug);
    if (found) {
      setProduct(found);
      if (found.sizes?.length) setSelectedSize(found.sizes[0]);
      if (found.colors?.length) setSelectedColor(found.colors[0]);
    }
  }, [slug]);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-headline font-bold">Product not found</h2>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images || [product.image];
  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current) return;
    const { left, top, width, height } = zoomRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    
    const img = zoomRef.current.querySelector('img');
    if (img) {
      img.style.transformOrigin = `${x}% ${y}%`;
    }
  };

  const relatedProducts = ALL_PRODUCTS
    .filter(p => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/collections/${product.categorySlug}`} className="hover:text-primary transition-colors">{product.category}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-primary truncate max-w-[150px]">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 max-w-6xl mx-auto">
          
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="flex flex-col-reverse md:flex-row gap-4">
              {/* Thumbnails */}
              <div className="flex md:flex-col gap-3 md:w-20 overflow-x-auto md:overflow-y-auto no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={cn(
                      "relative flex-shrink-0 w-20 aspect-[4/5] rounded-md overflow-hidden border-2 transition-all",
                      activeImageIndex === idx ? "border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`${product.name} view ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
              
              {/* Main Image with Precision Hover Zoom */}
              <div 
                ref={zoomRef}
                onMouseMove={handleMouseMove}
                className="relative flex-1 aspect-[4/5] max-h-[550px] bg-secondary/20 rounded-xl overflow-hidden shadow-sm group cursor-zoom-in"
              >
                <div className="h-full w-full overflow-hidden">
                  <Image
                    src={images[activeImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-200 ease-out group-hover:scale-[2.5]"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    style={{ transformOrigin: 'center center' }}
                  />
                </div>
                
                {/* Floating Tags */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.isNew && <Badge className="bg-primary text-primary-foreground font-bold px-4 py-1">NEW ARRIVAL</Badge>}
                  {product.isBestseller && <Badge className="bg-slate-900 text-white font-bold px-4 py-1">BESTSELLER</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col space-y-8 lg:sticky lg:top-24 h-fit">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Pehnava - She is Special</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-headline font-bold leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="text-destructive font-bold text-sm bg-destructive/10 px-3 py-1 rounded-full uppercase tracking-tighter">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Inclusive of all taxes</p>
            </div>

            <div className="h-px bg-border" />

            {/* Selection */}
            <div className="space-y-6">
              {/* Size Selector */}
              {product.sizes && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider">Size: <span className="text-primary">{selectedSize}</span></label>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-primary underline decoration-accent underline-offset-4">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "min-w-[3rem] h-12 px-4 flex items-center justify-center rounded-md border text-xs font-bold transition-all uppercase",
                          selectedSize === size 
                            ? "bg-primary text-white border-primary shadow-lg" 
                            : "bg-white text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors && (
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider">Color: <span className="text-primary">{selectedColor}</span></label>
                  <div className="flex gap-3">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 p-1 transition-all",
                          selectedColor === color ? "border-primary" : "border-transparent"
                        )}
                        title={color}
                      >
                        <div className="w-full h-full rounded-full border shadow-inner" style={{ backgroundColor: color.toLowerCase() }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and CTA */}
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center rounded-full border-2 border-border h-14 px-3 bg-secondary/10">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                      className="h-8 w-8 rounded-full hover:bg-primary/10"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-base">{quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setQuantity(q => q + 1)} 
                      className="h-8 w-8 rounded-full hover:bg-primary/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={handleAddToCart}
                    className="flex-1 h-14 bg-white text-primary border-primary hover:bg-primary/5 border-2 font-bold rounded-full text-xs tracking-[0.2em]"
                  >
                    ADD TO BAG
                  </Button>
                </div>

                <Button className="w-full h-16 bg-slate-900 text-white hover:bg-black font-bold rounded-full flex items-center justify-center gap-3 text-sm tracking-[0.1em] shadow-xl active:scale-95 transition-transform">
                  BUY IT NOW
                  <div className="flex items-center gap-1 opacity-80 border-l border-white/20 pl-3">
                    <Image src="https://placehold.co/40x24/png?text=UPI" width={40} height={24} alt="UPI" className="invert brightness-0" />
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>
              </div>

              {/* Trust markers */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t">
                {[
                  { icon: RotateCcw, label: '7 Days Return' },
                  { icon: Banknote, label: 'Cash On Delivery' },
                  { icon: Truck, label: 'Fast Shipping' },
                  { icon: ShieldCheck, label: 'Quality Assured' },
                  { icon: Lock, label: 'Safe Payments' },
                  { icon: MapPin, label: 'Made In India' }
                ].map((badge, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-2 group">
                    <div className="h-10 w-10 rounded-full bg-secondary/40 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <badge.icon className="h-5 w-5 text-primary/70" />
                    </div>
                    <span className="text-[10px] leading-tight text-muted-foreground font-bold uppercase tracking-widest">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accordions */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="description" className="border-b-2">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest hover:no-underline">Description</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed py-4">
                  {product.description || "Discover the magic of handcrafted tradition. Each piece is meticulously designed to celebrate your unique story with luxury fabrics and exquisite craftsmanship."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="details" className="border-b-2">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest hover:no-underline">Details & Specifications</AccordionTrigger>
                <AccordionContent className="py-4">
                  <ul className="space-y-3">
                    {(product.details || [
                      "Fabric: Luxury Blends",
                      "Style: Boutique Editorial",
                      "Care: Handle with Love",
                      "Handcrafted in India"
                    ]).map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-primary mt-2" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-none">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest hover:no-underline">Shipping & Returns</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed py-4 space-y-3">
                  <p>Standard delivery across India within 5-7 business days.</p>
                  <p>Free shipping on all prepaid orders above ₹2999.</p>
                  <p>Easy 7-day returns for unworn items in original condition.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Recommended Section */}
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 mt-32 border-t pt-20">
          <div className="flex flex-col items-center text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold uppercase tracking-wider">You May Also Like</h2>
            <div className="h-1 w-24 bg-accent/40 rounded-full" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
          <div className="flex justify-center mt-16">
             <Button asChild variant="outline" className="rounded-full px-12 h-14 font-bold uppercase text-[11px] tracking-[0.2em] hover:bg-primary hover:text-white transition-all">
               <Link href={`/collections/${product.categorySlug}`}>View Entire Collection</Link>
             </Button>
          </div>
        </section>
      )}
    </div>
  );
}
