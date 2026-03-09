'use client';

import { use, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const ITEMS_PER_PAGE = 8;

const AVAILABLE_COLORS = ["Red", "Gold", "Pink", "Green", "White", "Ivory", "Blue", "Black", "Yellow", "Multi"];
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "Free Size"];
const AVAILABLE_FABRICS = ["Silk", "Cotton", "Chiffon", "Georgette", "Velvet", "Rayon", "Kundan"];

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<CategoryMeta | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 15000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);

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

    // Filter by Color
    if (selectedColors.length > 0) {
      baseProducts = baseProducts.filter(p => p.colors?.some(c => selectedColors.includes(c)));
    }

    // Filter by Size
    if (selectedSizes.length > 0) {
      baseProducts = baseProducts.filter(p => p.sizes?.some(s => selectedSizes.includes(s)));
    }

    // Filter by Fabric
    if (selectedFabrics.length > 0) {
      baseProducts = baseProducts.filter(p => p.fabric && selectedFabrics.includes(p.fabric));
    }

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
  }, [slug, sortBy, priceRange, selectedColors, selectedSizes, selectedFabrics]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setPriceRange([0, 15000]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedFabrics([]);
  };

  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
    setCurrentPage(1);
  };

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
              <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                  <SheetTitle className="text-lg font-headline uppercase tracking-widest text-primary">Filters</SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="flex-1 px-6">
                  <div className="py-8 space-y-10">
                    {/* Price Filter */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider">Price Range</h3>
                        <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/5 rounded">
                          ₹{priceRange[0]} - ₹{priceRange[1]}
                        </span>
                      </div>
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
                          <span>₹0</span>
                          <span>₹15000+</span>
                        </div>
                      </div>
                    </div>

                    {/* Color Filter */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider">Color</h3>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => toggleFilter(selectedColors, setSelectedColors, color)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all uppercase tracking-tighter",
                              selectedColors.includes(color) 
                                ? "bg-primary text-white border-primary" 
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            )}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Filter */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider">Size</h3>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SIZES.map(size => (
                          <button
                            key={size}
                            onClick={() => toggleFilter(selectedSizes, setSelectedSizes, size)}
                            className={cn(
                              "w-10 h-10 rounded-md text-[10px] font-bold border transition-all uppercase flex items-center justify-center",
                              selectedSizes.includes(size) 
                                ? "bg-primary text-white border-primary shadow-sm" 
                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fabric Filter */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider">Fabric</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {AVAILABLE_FABRICS.map(fabric => (
                          <label 
                            key={fabric}
                            className="flex items-center gap-3 text-sm cursor-pointer group"
                            onClick={() => toggleFilter(selectedFabrics, setSelectedFabrics, fabric)}
                          >
                            <Checkbox 
                              checked={selectedFabrics.includes(fabric)} 
                              onCheckedChange={() => {}}
                            />
                            <span className={cn(
                              "text-xs transition-colors",
                              selectedFabrics.includes(fabric) ? "text-primary font-bold" : "text-muted-foreground"
                            )}>
                              {fabric}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-6 border-t bg-background mt-auto space-y-3">
                   <Button className="w-full rounded-full h-12 font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg">Apply Filters</Button>
                   <Button 
                    variant="ghost" 
                    className="w-full rounded-full font-bold uppercase text-[10px] tracking-[0.2em] text-muted-foreground hover:text-primary"
                    onClick={resetFilters}
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
                  <span className="opacity-50">SORT BY:</span>
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="best-selling">Best Selling</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest Arrivals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container mx-auto px-4 py-12">
        {paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium text-sm">No products found matching your active filters.</p>
            <Button onClick={resetFilters} variant="link" className="text-primary font-bold uppercase text-xs tracking-widest">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-x-10 md:gap-y-16">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-20">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-10 w-10 border-primary/20"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    className={cn(
                      "h-10 w-10 rounded-full font-bold transition-all", 
                      currentPage === i + 1 ? "shadow-md scale-110" : "border-primary/10 text-muted-foreground hover:border-primary/40"
                    )}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-10 w-10 border-primary/20"
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
        <section className="container mx-auto px-4 py-20 border-t border-b bg-secondary/10 mt-20 rounded-3xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center mb-12 space-y-4">
               <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/collections/all">Shop</Link>
                <span>/</span>
                <span className="text-primary">{category.name}</span>
              </nav>
              <h2 className="text-4xl md:text-5xl font-headline font-bold uppercase tracking-wider">{category.name}</h2>
              <div className="h-1 w-24 bg-accent/40 rounded-full" />
            </div>
            
            <div 
              className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6 text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: category.longDescription }} 
            />
            
            <div className="mt-20 pt-10 border-t border-primary/10">
              <h3 className="text-xs font-bold mb-8 uppercase tracking-[0.4em] text-primary text-center">Popular Searches</h3>
              <div className="flex flex-wrap justify-center items-center gap-y-4 gap-x-6 text-[11px] uppercase tracking-widest text-muted-foreground/80 font-bold">
                <Link href="/" className="hover:text-primary transition-all hover:-translate-y-0.5">Women Ethnic Wear</Link>
                <div className="h-1 w-1 bg-accent rounded-full opacity-30" />
                <Link href="/collections/ethnic-wear" className="hover:text-primary transition-all hover:-translate-y-0.5">Designer Ethnic Sets</Link>
                <div className="h-1 w-1 bg-accent rounded-full opacity-30" />
                <Link href="/collections/sarees" className="hover:text-primary transition-all hover:-translate-y-0.5">Silk Sarees</Link>
                <div className="h-1 w-1 bg-accent rounded-full opacity-30" />
                <Link href="/collections/western-fusion" className="hover:text-primary transition-all hover:-translate-y-0.5">Fusion Gowns</Link>
                <div className="h-1 w-1 bg-accent rounded-full opacity-30" />
                <Link href="/collections/accessories" className="hover:text-primary transition-all hover:-translate-y-0.5">Jewellery Collection</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cross-Sell */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h3 className="text-xs font-bold text-center mb-12 uppercase tracking-[0.5em] text-muted-foreground/60">Explore Other Collections</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {CATEGORIES.filter(c => c.slug !== slug).map((c) => (
              <Button key={c.slug} asChild variant="outline" className="rounded-full border-primary/10 hover:border-primary hover:bg-primary/5 text-primary h-14 px-10 font-bold text-[11px] uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md">
                <Link href={`/collections/${c.slug}`}>{c.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}