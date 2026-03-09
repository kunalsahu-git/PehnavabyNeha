'use client';

import { use, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { ALL_PRODUCTS, CATEGORIES, CategoryMeta } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

const ITEMS_PER_PAGE = 8;

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<CategoryMeta | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 15000]);

  useEffect(() => {
    const cat = CATEGORIES.find(c => c.slug === slug);
    if (cat) {
      setCategory(cat);
      setCurrentPage(1); 
    }
  }, [slug]);

  const filteredAndSortedProducts = useMemo(() => {
    let baseProducts = [];
    if (slug === 'new-arrivals') {
      baseProducts = ALL_PRODUCTS.filter(p => p.isNew);
    } else if (slug === 'sale') {
      baseProducts = ALL_PRODUCTS.filter(p => p.isSale);
    } else {
      baseProducts = ALL_PRODUCTS.filter(p => p.categorySlug === slug);
    }

    // Filter by Price
    baseProducts = baseProducts.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort Logic
    return [...baseProducts].sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "best-selling": return (a.isBestseller ? -1 : 1) - (b.isBestseller ? -1 : 1);
        case "discount-high": 
          const discountA = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
          const discountB = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
          return discountB - discountA;
        default: return 0;
      }
    });
  }, [slug, sortBy, priceRange]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-headline font-bold">Category not found</h2>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Banner Section */}
      <section className="relative h-[30vh] md:h-[35vh] w-full flex items-center justify-center overflow-hidden">
        <Image
          src={category.bannerImage}
          alt={category.name}
          fill
          className="object-cover brightness-50"
          priority
          data-ai-hint={category.bannerHint}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background/20" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-3xl space-y-4">
          <Link href="/" className="inline-flex items-center text-[10px] font-bold tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity mb-2">
            <ArrowLeft className="mr-2 h-3 w-3" /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight uppercase tracking-wider">
            {category.name}
          </h1>
          <p className="text-sm md:text-base font-light max-w-xl mx-auto opacity-90 line-clamp-2">
            {category.description}
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-20 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-primary">{category.name}</span>
            </nav>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border px-4 rounded-full">
                  <SlidersHorizontal className="h-3 w-3" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-lg font-headline uppercase tracking-widest">Filters</SheetTitle>
                </SheetHeader>
                <div className="py-8 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider">Price Range</h3>
                    <div className="px-2">
                      <Slider
                        defaultValue={[0, 15000]}
                        max={15000}
                        step={500}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="py-4"
                      />
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mt-2">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}+</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider">Availability</h3>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                        <input type="checkbox" className="rounded border-border" defaultChecked />
                        <span>In Stock</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer opacity-50">
                        <input type="checkbox" className="rounded border-border" disabled />
                        <span>Out of Stock</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2">
                   <Button className="w-full rounded-full font-bold uppercase text-[10px] tracking-widest">Apply Filters</Button>
                   <Button 
                    variant="outline" 
                    className="w-full rounded-full font-bold uppercase text-[10px] tracking-widest"
                    onClick={() => setPriceRange([0, 15000])}
                   >
                     Reset All
                   </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 text-[10px] font-bold uppercase tracking-wider border-none bg-secondary/60 rounded-full focus:ring-0">
                <div className="flex items-center gap-2">
                  <span className="opacity-50">SORT:</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="best-selling">Best Selling</SelectItem>
                <SelectItem value="price-low">Price: Low-High</SelectItem>
                <SelectItem value="price-high">Price: High-Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 py-12">
        {paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <p className="text-muted-foreground font-medium text-sm">No products match your criteria.</p>
            <Button onClick={() => setPriceRange([0, 15000])} variant="link" className="text-primary font-bold uppercase text-xs tracking-widest">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-16">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-10 w-10"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    className={cn("h-10 w-10 rounded-full font-bold", currentPage === i + 1 ? "shadow-md" : "")}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-10 w-10"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* SEO/Text Content Section */}
      {category.longDescription && (
        <section className="container mx-auto px-4 py-16 border-t border-b bg-secondary/10 mt-12 rounded-2xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center mb-10 space-y-3">
               <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/collections/all">Shop</Link>
                <span>/</span>
                <span className="text-primary">{category.name}</span>
              </nav>
              <h2 className="text-3xl md:text-4xl font-headline font-bold uppercase tracking-widest">{category.name}</h2>
            </div>
            
            <div 
              className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4 text-sm md:text-base text-center md:text-left"
              dangerouslySetInnerHTML={{ __html: category.longDescription }} 
            />
            
            <div className="mt-16 pt-8 border-t">
              <h3 className="text-xs font-bold mb-6 uppercase tracking-[0.2em] text-primary text-center">Popular Searches</h3>
              <div className="flex flex-wrap justify-center gap-y-3 gap-x-4 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                <Link href="/" className="hover:text-primary transition-colors">Women Ethnic Wear</Link>
                <span className="opacity-20">|</span>
                <Link href="/collections/ethnic-wear" className="hover:text-primary transition-colors">Designer Ethnic Sets</Link>
                <span className="opacity-20">|</span>
                <Link href="/collections/sarees" className="hover:text-primary transition-colors">Silk Sarees</Link>
                <span className="opacity-20">|</span>
                <Link href="/collections/western-fusion" className="hover:text-primary transition-colors">Fusion Gowns</Link>
                <span className="opacity-20">|</span>
                <Link href="/collections/accessories" className="hover:text-primary transition-colors">Jewellery Collection</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cross-Sell */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-sm font-bold text-center mb-10 uppercase tracking-[0.3em] text-muted-foreground">Other Collections</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.filter(c => c.slug !== slug).map((c) => (
              <Button key={c.slug} asChild variant="outline" className="rounded-full border-primary/20 hover:border-primary hover:bg-primary/5 text-primary h-12 px-8 font-bold text-[10px] uppercase tracking-widest transition-all">
                <Link href={`/collections/${c.slug}`}>{c.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
