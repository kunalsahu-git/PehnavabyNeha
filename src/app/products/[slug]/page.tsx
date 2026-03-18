'use client';

import { use, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight, Minus, Plus, Heart, Share2, RotateCcw, Truck,
  Banknote, ShieldCheck, Lock, MapPin, ArrowRight, Star, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/store/ProductCard";
import { Progress } from "@/components/ui/progress";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import {
  getProductBySlugQuery, getProductsByCategoryQuery, type ProductData,
} from "@/firebase/firestore/products";
import type { WithId } from "@/firebase/firestore/use-collection";

const REVIEWS = [
  { id: 1, name: "Adhuna", rating: 5, date: "Jan 09, 2026", comment: "Love the floral print" },
  { id: 2, name: "Chitrangda", rating: 4, date: "Dec 15, 2025", comment: "The fabric felt soft and lightweight, perfect for casual outings" },
  { id: 3, name: "Babita", rating: 4, date: "Dec 15, 2025", comment: "Comfortable outfit and nice fabric." },
];

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();
  const { addItem } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);

  // Fetch product by slug
  const slugQuery = useMemoFirebase(
    () => getProductBySlugQuery(db, slug),
    [db, slug]
  );
  const { data: productResults, isLoading } = useCollection<ProductData>(slugQuery);
  // Filter published client-side (query no longer includes compound where('published') clause)
  const product = (productResults ?? []).find(p => p.published !== false) as WithId<ProductData> | undefined;

  // Initialize selectors once product loads
  const [initialized, setInitialized] = useState(false);
  if (product && !initialized) {
    if (product.sizes?.length) setSelectedSize(product.sizes[0]);
    if (product.colors?.length) setSelectedColor(product.colors[0]);
    setInitialized(true);
  }

  // Related products
  const relatedQuery = useMemoFirebase(
    () => product?.categorySlug ? getProductsByCategoryQuery(db, product.categorySlug) : null,
    [db, product?.categorySlug]
  );
  const { data: relatedRaw } = useCollection<ProductData>(relatedQuery);
  const relatedProducts = (relatedRaw ?? [])
    .filter(p => p.published !== false && p.id !== product?.id)
    .slice(0, 4) as WithId<ProductData>[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
      </div>
    );
  }

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

  const images = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current) return;
    const { left, top, width, height } = zoomRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    const img = zoomRef.current.querySelector('img');
    if (img) img.style.transformOrigin = `${x}% ${y}%`;
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <nav className="flex items-center space-x-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground overflow-x-auto whitespace-nowrap no-scrollbar">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-2 w-2 md:h-3 md:w-3" />
          <Link href={`/collections/${product.categorySlug}`} className="hover:text-primary transition-colors">{product.category}</Link>
          <ChevronRight className="h-2 w-2 md:h-3 md:w-3" />
          <span className="text-primary truncate max-w-[120px] md:max-w-[150px]">{product.name}</span>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 max-w-6xl mx-auto">

          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="flex flex-col-reverse md:flex-row gap-4">
              <div className="flex md:flex-col gap-3 md:w-20 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)}
                    className={cn("relative flex-shrink-0 w-16 md:w-20 aspect-square rounded-md overflow-hidden border-2 transition-all",
                      activeImageIndex === idx ? "border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100")}>
                    <Image src={img} alt={`${product.name} view ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
              <div ref={zoomRef} onMouseMove={handleMouseMove}
                className="relative flex-1 aspect-square max-h-[400px] md:max-h-[480px] bg-secondary/20 rounded-xl overflow-hidden shadow-sm group cursor-zoom-in">
                <div className="h-full w-full overflow-hidden">
                  {images[activeImageIndex] ? (
                    <Image src={images[activeImageIndex]} alt={product.name} fill
                      className="object-cover transition-transform duration-200 ease-out group-hover:scale-[2]"
                      priority sizes="(max-width: 1024px) 100vw, 50vw"
                      style={{ transformOrigin: 'center center' }} />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-xs">No image</div>
                  )}
                </div>
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                  {product.isNew && <Badge className="bg-primary text-primary-foreground font-bold px-3 py-0.5 text-[10px] md:text-xs">NEW ARRIVAL</Badge>}
                  {product.isBestseller && <Badge className="bg-slate-900 text-white font-bold px-3 py-0.5 text-[10px] md:text-xs">BESTSELLER</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-6 md:space-y-8 lg:sticky lg:top-24 h-fit">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Pehnava - She is Special</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border"><Heart className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border"><Share2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-headline font-bold leading-tight">{product.name}</h1>
              {product.sku && (
                <p className="text-[10px] font-mono text-muted-foreground tracking-widest">SKU: {product.sku}</p>
              )}
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-2xl md:text-3xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-lg md:text-xl text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                    <span className="text-destructive font-bold text-[10px] md:text-xs bg-destructive/10 px-2.5 py-0.5 rounded-full uppercase tracking-tighter">Save {discount}%</span>
                  </>
                )}
              </div>
              <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Inclusive of all taxes</p>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-6">
              {/* Size */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Size: <span className="text-primary">{selectedSize}</span></label>
                    <button onClick={() => setIsSizeGuideOpen(true)} className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-primary underline decoration-accent underline-offset-4">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={cn("min-w-[2.5rem] md:min-w-[3rem] h-10 md:h-12 px-3 md:px-4 flex items-center justify-center rounded-md border text-[10px] md:text-xs font-bold transition-all uppercase",
                          selectedSize === size ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-muted-foreground border-border hover:border-primary/50")}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Color: <span className="text-primary">{selectedColor}</span></label>
                  <div className="flex gap-2.5 md:gap-3">
                    {product.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)}
                        className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full border-2 p-1 transition-all",
                          selectedColor === color ? "border-primary" : "border-transparent")}
                        title={color}>
                        <div className="w-full h-full rounded-full border shadow-inner" style={{ backgroundColor: color.toLowerCase() }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + CTA */}
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                  <div className="flex items-center rounded-full border-2 border-border h-12 md:h-14 px-3 bg-secondary/10 w-full sm:w-auto justify-between sm:justify-start">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 rounded-full hover:bg-primary/10">
                      <Minus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <span className="w-10 md:w-12 text-center font-bold text-sm md:text-base">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 rounded-full hover:bg-primary/10">
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                  <Button onClick={handleAddToCart}
                    className="w-full sm:flex-1 h-12 md:h-14 bg-white text-primary border-primary hover:bg-primary/5 border-2 font-bold rounded-full text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em]">
                    ADD TO BAG
                  </Button>
                </div>
                <Button className="w-full h-14 md:h-16 bg-slate-900 text-white hover:bg-black font-bold rounded-full flex items-center justify-center gap-2 md:gap-3 text-xs md:text-sm tracking-[0.1em] shadow-xl active:scale-95 transition-transform">
                  BUY IT NOW
                  <div className="flex items-center gap-1 opacity-80 border-l border-white/20 pl-2 md:pl-3">
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                  </div>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t">
                {[
                  { icon: RotateCcw, label: '7 Days Return' },
                  { icon: Banknote, label: 'Cash On Delivery' },
                  { icon: Truck, label: 'Fast Shipping' },
                  { icon: ShieldCheck, label: 'Quality Assured' },
                  { icon: Lock, label: 'Safe Payments' },
                  { icon: MapPin, label: 'Made In India' },
                ].map((badge, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-1.5 md:space-y-2 group">
                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-secondary/40 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <badge.icon className="h-4 w-4 md:h-5 md:w-5 text-primary/70" />
                    </div>
                    <span className="text-[8px] md:text-[10px] leading-tight text-muted-foreground font-bold uppercase tracking-widest">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accordions */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="description" className="border-b-2">
                <AccordionTrigger className="text-[10px] md:text-xs font-bold uppercase tracking-widest hover:no-underline">Description</AccordionTrigger>
                <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed py-3 md:py-4">
                  {product.description || "Discover the magic of handcrafted tradition. Each piece is meticulously designed to celebrate your unique story with luxury fabrics and exquisite craftsmanship."}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="details" className="border-b-2">
                <AccordionTrigger className="text-[10px] md:text-xs font-bold uppercase tracking-widest hover:no-underline">Details & Specifications</AccordionTrigger>
                <AccordionContent className="py-3 md:py-4">
                  <ul className="space-y-2 md:space-y-3">
                    {(product.details?.length ? product.details : ["Fabric: Luxury Blends", "Style: Boutique Editorial", "Care: Handle with Love", "Handcrafted in India"]).map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                        <div className="h-1 w-1 rounded-full bg-primary mt-1.5 md:mt-2" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping" className="border-none">
                <AccordionTrigger className="text-[10px] md:text-xs font-bold uppercase tracking-widest hover:no-underline">Shipping & Returns</AccordionTrigger>
                <AccordionContent className="text-xs md:text-sm text-muted-foreground leading-relaxed py-3 md:py-4 space-y-2 md:space-y-3">
                  <p>Standard delivery across India within 5–7 business days.</p>
                  <p>Free shipping on all prepaid orders above ₹2999.</p>
                  <p>Easy 7-day returns for unworn items in original condition.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="container mx-auto px-4 py-16 md:py-24 border-t mt-16 md:mt-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 md:gap-12 items-start justify-between">
            <div className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
              <h2 className="text-base md:text-lg font-bold text-muted-foreground uppercase tracking-widest mb-4 md:mb-6">Customer reviews</h2>
              <div className="flex items-center gap-3 md:gap-4 mb-2">
                <span className="text-5xl md:text-6xl font-headline font-bold">4.3</span>
                <span className="text-xl md:text-2xl text-muted-foreground">/ 5</span>
              </div>
              <div className="flex items-center gap-0.5 md:gap-1 text-accent mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4 md:h-5 md:w-5 fill-current", i < 4 ? "text-accent" : "text-muted-foreground/30")} />
                ))}
                <span className="text-xs md:text-sm text-muted-foreground font-bold ml-2">3 reviews</span>
              </div>
              <div className="w-full space-y-2 md:space-y-3 mt-4">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-[10px] md:text-xs font-bold flex items-center gap-1 min-w-[20px] md:min-w-[24px]">
                      {star} <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-accent text-accent" />
                    </span>
                    <Progress value={star === 5 ? 33 : star === 4 ? 66 : 0} className="h-1.5 md:h-2 flex-1" />
                    <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground w-4">{star === 5 ? 1 : star === 4 ? 2 : 0}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full md:w-auto mt-6 md:mt-0">
              <Button className="w-full md:w-auto bg-slate-800 text-white rounded-md px-10 h-11 md:h-12 hover:bg-slate-900 transition-colors text-xs font-bold">Write a review</Button>
            </div>
          </div>
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-12 md:mt-16 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 no-scrollbar">
            {REVIEWS.map((review) => (
              <div key={review.id} className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-slate-100 flex flex-col gap-3 md:gap-4 min-w-[280px] md:min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5 md:h-4 md:w-4 fill-current", i < review.rating ? "text-accent" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{review.date}</span>
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold flex items-center gap-2">{review.name} <span>🇮🇳</span></h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mt-2 italic">"{review.comment}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container mx-auto px-4 mt-8 md:mt-10 border-t pt-16 md:pt-20">
          <div className="flex flex-col items-center text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <h2 className="text-2xl md:text-3xl lg:text-5xl font-headline font-bold uppercase tracking-wider">You May Also Like</h2>
            <div className="h-1 w-16 md:w-24 bg-accent/40 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-10">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} {...(p as any)} />
            ))}
          </div>
          <div className="flex justify-center mt-12 md:mt-16">
            <Button asChild variant="outline" className="rounded-full w-full sm:w-auto px-8 md:px-12 h-12 md:h-14 font-bold uppercase text-[10px] md:text-[11px] tracking-[0.15em] md:tracking-[0.2em] hover:bg-primary hover:text-white transition-all">
              <Link href={`/collections/${product.categorySlug}`}>View Entire Collection</Link>
            </Button>
          </div>
        </section>
      )}
      {/* Size Guide Modal */}
      <Dialog open={isSizeGuideOpen} onOpenChange={setIsSizeGuideOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl uppercase tracking-wider">Size Guide</DialogTitle>
          </DialogHeader>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-4">All measurements in inches / centimeters</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-primary/5">
                  <th className="border border-border px-3 py-2.5 text-left font-bold uppercase tracking-wider text-[10px]">Size</th>
                  <th className="border border-border px-3 py-2.5 text-center font-bold uppercase tracking-wider text-[10px]">Chest<br/><span className="font-normal text-muted-foreground normal-case tracking-normal">in / cm</span></th>
                  <th className="border border-border px-3 py-2.5 text-center font-bold uppercase tracking-wider text-[10px]">Waist<br/><span className="font-normal text-muted-foreground normal-case tracking-normal">in / cm</span></th>
                  <th className="border border-border px-3 py-2.5 text-center font-bold uppercase tracking-wider text-[10px]">Hips<br/><span className="font-normal text-muted-foreground normal-case tracking-normal">in / cm</span></th>
                  <th className="border border-border px-3 py-2.5 text-center font-bold uppercase tracking-wider text-[10px]">Length<br/><span className="font-normal text-muted-foreground normal-case tracking-normal">in / cm</span></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { size: 'XS', chest: '32 / 81', waist: '26 / 66', hips: '35 / 89', length: '52 / 132' },
                  { size: 'S',  chest: '34 / 86', waist: '28 / 71', hips: '37 / 94', length: '52 / 132' },
                  { size: 'M',  chest: '36 / 91', waist: '30 / 76', hips: '39 / 99', length: '53 / 135' },
                  { size: 'L',  chest: '38 / 97', waist: '32 / 81', hips: '41 / 104', length: '53 / 135' },
                  { size: 'XL', chest: '40 / 102', waist: '34 / 86', hips: '43 / 109', length: '54 / 137' },
                  { size: 'XXL', chest: '42 / 107', waist: '36 / 91', hips: '45 / 114', length: '54 / 137' },
                  { size: 'Free Size', chest: '36–40 / 91–102', waist: '30–34 / 76–86', hips: '38–42 / 97–107', length: '52–54 / 132–137' },
                ].map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-border px-3 py-2.5 font-bold text-primary">{row.size}</td>
                    <td className="border border-border px-3 py-2.5 text-center text-muted-foreground">{row.chest}</td>
                    <td className="border border-border px-3 py-2.5 text-center text-muted-foreground">{row.waist}</td>
                    <td className="border border-border px-3 py-2.5 text-center text-muted-foreground">{row.hips}</td>
                    <td className="border border-border px-3 py-2.5 text-center text-muted-foreground">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
            <span className="font-bold text-foreground">How to measure:</span> Chest — measure around the fullest part. Waist — measure around the narrowest part. Hips — measure around the fullest part of hips. Length — measured from shoulder to hem. All measurements are body measurements, not garment measurements.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
