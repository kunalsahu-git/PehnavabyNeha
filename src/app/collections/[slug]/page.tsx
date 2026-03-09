
'use client';

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Filter, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
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

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<CategoryMeta | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    const cat = CATEGORIES.find(c => c.slug === slug);
    if (cat) {
      setCategory(cat);
      
      // Filtering logic
      let filtered = [];
      if (slug === 'new-arrivals') {
        filtered = ALL_PRODUCTS.filter(p => p.isNew);
      } else if (slug === 'sale') {
        filtered = ALL_PRODUCTS.filter(p => p.isSale);
      } else {
        filtered = ALL_PRODUCTS.filter(p => p.categorySlug === slug);
      }
      setProducts(filtered);
    }
  }, [slug]);

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
      <section className="relative h-[40vh] md:h-[50vh] w-full flex items-center justify-center overflow-hidden">
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
          <h1 className="text-4xl md:text-7xl font-headline font-bold leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
            {category.name}
          </h1>
          <p className="text-sm md:text-lg font-light max-w-xl mx-auto opacity-95 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            {category.description}
          </p>
        </div>
      </section>

      {/* Filter & Toolbar */}
      <section className="sticky top-20 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </Button>
            <span className="hidden md:inline-block text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Showing {products.length} Products
            </span>
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
              <SelectTrigger className="w-[180px] h-9 text-xs font-bold uppercase tracking-wider border-none bg-secondary/50 rounded-full focus:ring-0">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured Items</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="container mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-muted-foreground font-medium">No products found in this collection yet.</p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </section>

      {/* Cross-Sell / Other Collections */}
      <section className="bg-secondary/20 py-16 mt-12 border-t border-b">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-headline font-bold text-center mb-8">Browse Other Collections</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.filter(c => c.slug !== slug).map((c) => (
              <Button key={c.slug} asChild variant="outline" className="rounded-full border-primary/20 hover:border-primary hover:bg-primary/5 text-primary h-12 px-8 font-bold text-xs uppercase tracking-widest">
                <Link href={`/collections/${c.slug}`}>{c.name}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
