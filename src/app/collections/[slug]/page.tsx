'use client';

import { use, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/ProductCard";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { normalizeColor, colorToCSS, isLightColor } from "@/lib/colors";
import {
  getProductsByCategoryQuery, getProductsByCollectionQuery,
  getNewArrivalsQuery, getSaleProductsQuery, type ProductData,
} from "@/firebase/firestore/products";
import { getAllCategoriesQuery, type CategoryData } from "@/firebase/firestore/categories";
import { getAllCollectionsQuery, type CollectionData } from "@/firebase/firestore/collections";
import type { WithId } from "@/firebase/firestore/use-collection";

const ITEMS_PER_PAGE = 8;
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];
const AVAILABLE_FABRICS = ["Silk", "Cotton", "Chiffon", "Georgette", "Velvet", "Rayon", "Linen", "Organza", "Chanderi", "Banarasi"];

// Static meta for special pages that aren't in Firestore categories
const SPECIAL_PAGES: Record<string, { name: string; description: string }> = {
  'new-arrivals': { name: 'New Arrivals', description: "Fresh drops from our atelier — the newest and most-loved pieces." },
  'sale': { name: 'Sale', description: "Luxury fashion at exceptional prices. Find your next favourite piece at a steal." },
};

// Shared filter panel used in both desktop sidebar and mobile Sheet
function FilterPanelContent({
  priceRange, setPriceRange,
  availableColors, selectedColors, setSelectedColors,
  selectedSizes, setSelectedSizes,
  selectedFabrics, setSelectedFabrics,
  toggleFilter,
  openSections, toggleSection,
}: {
  priceRange: number[];
  setPriceRange: (v: number[]) => void;
  availableColors: { name: string; hex: string }[];
  selectedColors: string[];
  setSelectedColors: (v: string[]) => void;
  selectedSizes: string[];
  setSelectedSizes: (v: string[]) => void;
  selectedFabrics: string[];
  setSelectedFabrics: (v: string[]) => void;
  toggleFilter: (list: string[], setList: (v: string[]) => void, item: string) => void;
  openSections: Set<string>;
  toggleSection: (key: string) => void;
}) {
  return (
    <div className="py-4 space-y-0 divide-y divide-border/60">
      {/* Price */}
      <div className="py-4">
        <button onClick={() => toggleSection('price')} className="w-full flex items-center justify-between pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider">Price Range</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", openSections.has('price') ? "rotate-180" : "")} />
        </button>
        {openSections.has('price') && (
          <div className="space-y-3 pt-1">
            <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/5 rounded inline-block">
              ₹{priceRange[0].toLocaleString()} – ₹{priceRange[1].toLocaleString()}
            </span>
            <div className="px-1">
              <Slider defaultValue={[0, 50000]} max={50000} step={500} value={priceRange} onValueChange={setPriceRange} className="py-3" />
              <div className="flex items-center justify-between text-[9px] font-medium text-muted-foreground">
                <span>₹0</span><span>₹50,000+</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Colour */}
      <div className="py-4">
        <button onClick={() => toggleSection('colour')} className="w-full flex items-center justify-between pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider">Colour</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", openSections.has('colour') ? "rotate-180" : "")} />
        </button>
        {openSections.has('colour') && (
          availableColors.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">No colours available</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {availableColors.map(color => {
                const active = selectedColors.includes(color.name);
                return (
                  <button
                    key={color.name}
                    title={color.name}
                    onClick={() => toggleFilter(selectedColors, setSelectedColors, color.name)}
                    className={cn(
                      "relative h-7 w-7 rounded-full transition-all ring-offset-2 focus:outline-none",
                      active ? "ring-2 ring-primary scale-110 shadow-md" : "hover:scale-110 hover:shadow-sm",
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
          )
        )}
      </div>

      {/* Size */}
      <div className="py-4">
        <button onClick={() => toggleSection('size')} className="w-full flex items-center justify-between pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider">Size</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", openSections.has('size') ? "rotate-180" : "")} />
        </button>
        {openSections.has('size') && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {AVAILABLE_SIZES.map(size => (
              <button key={size} onClick={() => toggleFilter(selectedSizes, setSelectedSizes, size)}
                className={cn(
                  "px-2.5 h-8 rounded-md text-[9px] font-bold border transition-all uppercase",
                  selectedSizes.includes(size)
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                )}>
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fabric */}
      <div className="py-4">
        <button onClick={() => toggleSection('fabric')} className="w-full flex items-center justify-between pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider">Fabric</span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", openSections.has('fabric') ? "rotate-180" : "")} />
        </button>
        {openSections.has('fabric') && (
          <div className="space-y-2 pt-1">
            {AVAILABLE_FABRICS.map(fabric => (
              <label key={fabric} className="flex items-center gap-2.5 cursor-pointer group" onClick={() => toggleFilter(selectedFabrics, setSelectedFabrics, fabric)}>
                <Checkbox checked={selectedFabrics.includes(fabric)} onCheckedChange={() => {}} className="h-3.5 w-3.5" />
                <span className={cn("text-[11px] transition-colors", selectedFabrics.includes(fabric) ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground")}>{fabric}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();

  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['price', 'colour', 'size', 'fabric']));

  const toggleSection = (key: string) =>
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // ── LIVE: All categories + collections for meta and cross-sell ──────────────
  const categoriesQuery = useMemoFirebase(() => db ? getAllCategoriesQuery(db) : null, [db]);
  const { data: allCategories } = useCollection<CategoryData>(categoriesQuery);

  const collectionsQuery = useMemoFirebase(() => db ? getAllCollectionsQuery(db) : null, [db]);
  const { data: allCollections } = useCollection<CollectionData>(collectionsQuery);

  // Find matching category or editorial collection for this slug
  const firestoreCategory = (allCategories ?? []).find(c => c.slug === slug);
  const firestoreCollection = (allCollections ?? []).find(c => c.slug === slug);

  // ── LIVE: Product queries — category, editorial collection, or special pages ─
  // Run category + collection queries in parallel, use whichever returns results.
  // Special slugs (new-arrivals, sale) get their own dedicated queries.
  const isSpecial = slug === 'new-arrivals' || slug === 'sale';

  const categoryProductsQuery = useMemoFirebase(() => {
    if (!db || isSpecial) return null;
    return getProductsByCategoryQuery(db, slug);
  }, [db, slug]);

  const collectionProductsQuery = useMemoFirebase(() => {
    if (!db || isSpecial) return null;
    return getProductsByCollectionQuery(db, slug);
  }, [db, slug]);

  const newArrivalsQuery = useMemoFirebase(() => (db && slug === 'new-arrivals') ? getNewArrivalsQuery(db) : null, [db, slug]);
  const saleQuery = useMemoFirebase(() => (db && slug === 'sale') ? getSaleProductsQuery(db) : null, [db, slug]);

  const { data: catProducts, isLoading: catLoading } = useCollection<ProductData>(categoryProductsQuery);
  const { data: colProducts, isLoading: colLoading } = useCollection<ProductData>(collectionProductsQuery);
  const { data: newArrivalsProducts, isLoading: newLoading } = useCollection<ProductData>(newArrivalsQuery);
  const { data: saleProducts, isLoading: saleLoading } = useCollection<ProductData>(saleQuery);

  const isLoading = catLoading || colLoading || newLoading || saleLoading;

  // Merge: prefer category products; fallback to collection products for editorial slugs
  // Filter published client-side (queries no longer include the compound where('published') clause)
  const rawProducts: WithId<ProductData>[] = (() => {
    const filterPublished = (arr: WithId<ProductData>[]) => arr.filter(p => p.published !== false);
    if (slug === 'new-arrivals') return filterPublished((newArrivalsProducts ?? []) as WithId<ProductData>[]);
    if (slug === 'sale') return filterPublished((saleProducts ?? []) as WithId<ProductData>[]);
    const cat = filterPublished((catProducts ?? []) as WithId<ProductData>[]);
    const col = filterPublished((colProducts ?? []) as WithId<ProductData>[]);
    return cat.length > 0 ? cat : col;
  })();

  // Derive unique colors from actual products in this collection (with dedup by name)
  const availableColors = useMemo(() => {
    const seen = new Set<string>();
    const colors: { name: string; hex: string }[] = [];
    for (const p of rawProducts) {
      for (const raw of p.colors ?? []) {
        const c = normalizeColor(raw);
        if (!seen.has(c.name.toLowerCase())) {
          seen.add(c.name.toLowerCase());
          colors.push(c);
        }
      }
    }
    return colors;
  }, [rawProducts]);

  // Page meta — Firestore first, then special pages, then slug-derived title
  const specialMeta = SPECIAL_PAGES[slug];
  const pageName = firestoreCategory?.name ?? firestoreCollection?.name ?? specialMeta?.name
    ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const pageDescription = firestoreCategory?.description ?? firestoreCollection?.description ?? specialMeta?.description ?? '';
  const bannerImage = firestoreCategory?.imageUrl ?? firestoreCollection?.imageUrl ?? '';
  const longDescription = firestoreCategory?.longDescription ?? null;

  // Cross-sell: all published categories (excluding current), limited to 6
  const crossSell = (allCategories ?? [])
    .filter(c => c.published && c.slug !== slug)
    .slice(0, 8);

  // Client-side filter + sort
  const filteredAndSortedProducts = useMemo(() => {
    let products = [...rawProducts];
    products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (selectedColors.length > 0) products = products.filter(p =>
      p.colors?.some(raw => selectedColors.includes(normalizeColor(raw).name))
    );
    if (selectedSizes.length > 0) products = products.filter(p => p.sizes?.some(s => selectedSizes.includes(s)));
    if (selectedFabrics.length > 0) products = products.filter(p => p.fabric && selectedFabrics.some(f => p.fabric!.toLowerCase().includes(f.toLowerCase())));

    return products.sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        case "newest": {
          const at = a.createdAt?.toDate?.()?.getTime() ?? new Date(a.createdAt ?? 0).getTime();
          const bt = b.createdAt?.toDate?.()?.getTime() ?? new Date(b.createdAt ?? 0).getTime();
          return bt - at;
        }
        case "best-selling": return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
        case "discount-high": {
          const da = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
          const db2 = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
          return db2 - da;
        }
        default: return 0;
      }
    });
  }, [rawProducts, sortBy, priceRange, selectedColors, selectedSizes, selectedFabrics]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setPriceRange([0, 50000]); setSelectedColors([]); setSelectedSizes([]); setSelectedFabrics([]);
  };
  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Banner — LIVE from Firestore category/collection imageUrl */}
      <section className="relative h-[30vh] md:h-[35vh] w-full flex items-center justify-center overflow-hidden">
        {bannerImage ? (
          <Image src={bannerImage} alt={pageName} fill className="object-cover brightness-50" priority />
        ) : (
          <div className="absolute inset-0 bg-primary/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background/20" />
        <div className="relative z-10 text-center text-white px-4 max-w-3xl space-y-4">
          <Link href="/" className="inline-flex items-center text-[10px] font-bold tracking-widest uppercase opacity-80 hover:opacity-100 transition-opacity mb-2">
            <ArrowLeft className="mr-2 h-3 w-3" /> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight uppercase tracking-wider">{pageName}</h1>
          {pageDescription && (
            <p className="text-sm md:text-base font-light max-w-xl mx-auto opacity-90 line-clamp-2">{pageDescription}</p>
          )}
        </div>
      </section>

      {/* Toolbar */}
      <section className="sticky top-20 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <span className="text-primary">{pageName}</span>
            </nav>
            {/* Mobile filter button — only visible on smaller screens */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border px-4 rounded-full">
                  <SlidersHorizontal className="h-3 w-3" /> Filters
                  {(selectedColors.length + selectedSizes.length + selectedFabrics.length) > 0 && (
                    <span className="ml-1 bg-primary text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {selectedColors.length + selectedSizes.length + selectedFabrics.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[360px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b flex flex-row items-center justify-between">
                  <SheetTitle className="text-lg font-headline uppercase tracking-widest text-primary">Filters</SheetTitle>
                  {(selectedColors.length + selectedSizes.length + selectedFabrics.length) > 0 && (
                    <button onClick={resetFilters} className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
                      Reset All
                    </button>
                  )}
                </SheetHeader>
                <ScrollArea className="flex-1 px-6">
                  <FilterPanelContent
                    priceRange={priceRange} setPriceRange={setPriceRange}
                    availableColors={availableColors} selectedColors={selectedColors}
                    selectedSizes={selectedSizes} selectedFabrics={selectedFabrics}
                    toggleFilter={toggleFilter} setSelectedColors={setSelectedColors}
                    setSelectedSizes={setSelectedSizes} setSelectedFabrics={setSelectedFabrics}
                    openSections={openSections} toggleSection={toggleSection}
                  />
                </ScrollArea>
                <div className="p-6 border-t bg-background">
                  <Button variant="ghost" className="w-full rounded-full font-bold uppercase text-[10px] tracking-[0.2em] text-muted-foreground hover:text-primary" onClick={resetFilters}>Reset All Filters</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-muted-foreground hidden sm:block">
              {isLoading ? '…' : `${filteredAndSortedProducts.length} items`}
            </span>
            <Select value={sortBy} onValueChange={v => { setSortBy(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] h-9 text-[10px] font-bold uppercase tracking-wider border-none bg-secondary/60 rounded-full focus:ring-0">
                <div className="flex items-center gap-2"><span className="opacity-50">SORT BY:</span><SelectValue /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="best-selling">Best Selling</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="discount-high">Biggest Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Main: Sidebar + Product Grid */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex gap-8 items-start">

          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-36 self-start">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-3 w-3" /> Filters
              </span>
              {(selectedColors.length + selectedSizes.length + selectedFabrics.length) > 0 && (
                <button onClick={resetFilters} className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <X className="h-2.5 w-2.5" /> Reset
                </button>
              )}
            </div>
            <FilterPanelContent
              priceRange={priceRange} setPriceRange={setPriceRange}
              availableColors={availableColors} selectedColors={selectedColors}
              selectedSizes={selectedSizes} selectedFabrics={selectedFabrics}
              toggleFilter={toggleFilter} setSelectedColors={setSelectedColors}
              setSelectedSizes={setSelectedSizes} setSelectedFabrics={setSelectedFabrics}
              openSections={openSections} toggleSection={toggleSection}
            />
          </aside>

          {/* Product area */}
          <div className="flex-1 min-w-0">
            {/* Active filter chips */}
            {(selectedColors.length + selectedSizes.length + selectedFabrics.length) > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedColors.map(name => (
                  <button key={name} onClick={() => toggleFilter(selectedColors, setSelectedColors, name)}
                    className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                    {name} <X className="h-2.5 w-2.5" />
                  </button>
                ))}
                {selectedSizes.map(s => (
                  <button key={s} onClick={() => toggleFilter(selectedSizes, setSelectedSizes, s)}
                    className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                    {s} <X className="h-2.5 w-2.5" />
                  </button>
                ))}
                {selectedFabrics.map(f => (
                  <button key={f} onClick={() => toggleFilter(selectedFabrics, setSelectedFabrics, f)}
                    className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                    {f} <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">No products found matching your filters.</p>
                <Button onClick={resetFilters} variant="link" className="text-primary font-bold uppercase text-xs tracking-widest">Clear All Filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-x-8 md:gap-y-14">
                  {paginatedProducts.map(product => (
                    <ProductCard key={product.id} {...(product as any)} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-20">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-primary/20"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                      <Button key={i} variant={currentPage === i + 1 ? "default" : "outline"}
                        className={cn("h-10 w-10 rounded-full font-bold transition-all", currentPage === i + 1 ? "shadow-md scale-110" : "border-primary/10 text-muted-foreground hover:border-primary/40")}
                        onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </Button>
                    ))}
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-primary/20"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* SEO long description — LIVE from Firestore category longDescription */}
      {longDescription && (
        <section className="container mx-auto px-4 py-20 border-t border-b bg-secondary/10 mt-20 rounded-3xl">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center mb-12 space-y-4">
              <h2 className="text-4xl md:text-5xl font-headline font-bold uppercase tracking-wider">{pageName}</h2>
              <div className="h-1 w-24 bg-accent/40 rounded-full" />
            </div>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6 text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: longDescription }} />
          </div>
        </section>
      )}

      {/* Cross-sell — LIVE from Firestore categories */}
      {crossSell.length > 0 && (
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h3 className="text-xs font-bold text-center mb-12 uppercase tracking-[0.5em] text-muted-foreground/60">Explore Other Collections</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {crossSell.map(c => (
                <Button key={c.slug} asChild variant="outline"
                  className="rounded-full border-primary/10 hover:border-primary hover:bg-primary/5 text-primary h-14 px-10 font-bold text-[11px] uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-md">
                  <Link href={`/collections/${c.slug}`}>{c.name}</Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
