'use client';

import { use, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { ALL_PRODUCTS, CATEGORIES, CategoryMeta, Product } from "@/lib/store-data";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 8;

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<CategoryMeta | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const cat = CATEGORIES.find(c => c.slug === slug);
    if (cat) {
      setCategory(cat);
      setCurrentPage(1); // Reset to first page on category change
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
        case "discount-low": 
          const discALow = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
          const discBLow = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
          return discALow - discBLow;
        default: return 0;
      }
    });
  }, [slug, sortBy]);

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
      {/* Dynamic Banner Section */}
      <section className="relative h-[35vh] md:h-[40vh] w-full flex items-center justify-center overflow-hidden">
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
          <Link href="/" className="inline-flex items-center text-xs font-bold tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity mb-2">
            <ArrowLeft className="mr-2 h-3 w-3" /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-6xl font-headline font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            {category.name}
          </h1>
          <p className="text-sm md:text-lg font-light max-w-xl mx-auto opacity-95 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            {category.description}
          </p>
        </div>
      </section>

      {/* Breadcrumb & Filter Toolbar */}
      <section className="sticky top-20 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/collections/new-arrivals" className="hover:text-primary transition-colors">Shop</Link>
              <span>/</span>
              <span className="text-primary">{category.name}</span>
            </nav>
            <Button variant="ghost" size="sm" className="font-bold text-xs uppercase tracking-widest flex lg:hidden items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1 border-r pr-4 mr-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-9 text-[10px] font-bold uppercase tracking-wider border-none bg-secondary/80 rounded-full focus:ring-0">
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
                <SelectItem value="oldest">Oldest to Newest</SelectItem>
                <SelectItem value="newest">Newest to Oldest</SelectItem>
                <SelectItem value="discount-high">Discount: High to Low</SelectItem>
                <SelectItem value="discount-low">Discount: Low to High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="container mx-auto px-4 py-12">
        {paginatedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-muted-foreground font-medium">No products found in this collection yet.</p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-16">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    className={cn("h-10 w-10 rounded-full font-bold", currentPage === i + 1 ? "shadow-lg" : "")}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full"
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

      {/* SEO Text Content Section */}
      {category.longDescription && (
        <section className="container mx-auto px-4 py-16 border-t border-b bg-secondary/5 mt-12">
          <div className="max-w-4xl mx-auto prose prose-neutral dark:prose-invert">
            <h2 className="text-3xl font-headline font-bold text-center mb-8 uppercase tracking-widest">{category.name}</h2>
            <div 
              className="text-muted-foreground leading-relaxed space-y-4 text-sm"
              dangerouslySetInnerHTML={{ __html: category.longDescription }} 
            />
            
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-primary">Popular Searches</h3>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">
                <Link href="/" className="hover:text-primary">Women Ethnic Wear</Link>
                <span>|</span>
                <Link href="/collections/ethnic-wear" className="hover:text-primary">Designer Ethnic Sets</Link>
                <span>|</span>
                <Link href="/collections/sarees" className="hover:text-primary">Silk Sarees</Link>
                <span>|</span>
                <Link href="/collections/western-fusion" className="hover:text-primary">Fusion Gowns</Link>
                <span>|</span>
                <Link href="/collections/accessories" className="hover:text-primary">Jewellery Collection</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cross-Sell / Other Collections */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-headline font-bold text-center mb-8 uppercase tracking-widest">Browse More Collections</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.filter(c => c.slug !== slug).map((c) => (
              <Button key={c.slug} asChild variant="ghost" className="rounded-full border border-primary/10 hover:border-primary text-primary h-12 px-8 font-bold text-[10px] uppercase tracking-widest transition-all">
                <Link href={`/collections/${c.slug}`}>{c.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}