'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Loader2, ExternalLink, Search, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import { saveFeaturedProductConfig, getFeaturedProductConfig } from '@/firebase/firestore/settings';
import { getAllProductsQuery, type ProductData } from '@/firebase/firestore/products';

export default function FeaturedProductAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Config state
  const [selectedProduct, setSelectedProduct] = useState<WithId<ProductData> | null>(null);
  const [headline, setHeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

  // Search state
  const [search, setSearch] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Load all published products
  const productsQuery = useMemoFirebase(() => db ? getAllProductsQuery(db) : null, [db]);
  const { data: allProducts, isLoading: productsLoading } = useCollection<ProductData>(productsQuery);
  const publishedProducts = (allProducts ?? []).filter(p => p.published !== false);

  // Filtered by search
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return publishedProducts;
    const q = search.toLowerCase();
    return publishedProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [publishedProducts, search]);

  // Load existing config on mount — resolve the saved productId to a full product object
  useEffect(() => {
    if (!db || productsLoading || !allProducts) return;
    getFeaturedProductConfig(db).then(config => {
      if (config?.productId) {
        const found = allProducts.find(p => p.id === config.productId);
        if (found) setSelectedProduct(found);
      }
      setHeadline(config?.headline ?? '');
      setIsConfigLoading(false);
    });
  }, [db, productsLoading, allProducts]);

  const handleSelectProduct = (product: WithId<ProductData>) => {
    setSelectedProduct(product);
    setSearch('');
    setIsPickerOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedProduct(null);
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      toast({ variant: 'destructive', title: 'No product selected', description: 'Search and select a product to feature.' });
      return;
    }
    setIsSaving(true);
    try {
      await saveFeaturedProductConfig(db, {
        productId: selectedProduct.id,
        productSlug: selectedProduct.slug,
        productName: selectedProduct.name,
        headline: headline.trim(),
      });
      toast({ title: 'Featured Product Saved', description: `"${selectedProduct.name}" will be showcased on the homepage.` });
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not update the config.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isConfigLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Featured Product</h1>
        <p className="text-sm text-muted-foreground">
          Select the product highlighted in the full-width showcase section on your homepage.
        </p>
      </div>

      {/* Config card */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardContent className="p-8 space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b">
            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-headline font-bold text-xl uppercase tracking-wider">Homepage Showcase</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {publishedProducts.length} published products available
              </p>
            </div>
          </div>

          {/* Product Selector */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Featured Product <span className="text-red-500">*</span>
            </Label>

            {selectedProduct ? (
              /* Selected state — show the product card */
              <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-primary bg-primary/5">
                {selectedProduct.image && (
                  <div className="relative h-16 w-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-bold text-sm truncate">{selectedProduct.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₹{selectedProduct.price.toLocaleString()}
                    {selectedProduct.originalPrice && (
                      <span className="line-through ml-2 opacity-50">₹{selectedProduct.originalPrice.toLocaleString()}</span>
                    )}
                    {' · '}
                    <span className="font-mono text-[10px]">{selectedProduct.slug}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge className="text-[9px] uppercase tracking-widest bg-slate-100 text-slate-600 border-none rounded-full">
                      {selectedProduct.category}
                    </Badge>
                    {selectedProduct.isNew && <Badge className="text-[9px] uppercase tracking-widest bg-accent/20 text-accent-foreground border-none rounded-full">New</Badge>}
                    {selectedProduct.isBestseller && <Badge className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary border-none rounded-full">Bestseller</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/products/${selectedProduct.slug}`} target="_blank">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500" onClick={handleClearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Empty state — show search trigger */
              <button
                onClick={() => setIsPickerOpen(true)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500">Click to select a product</p>
                  <p className="text-xs text-muted-foreground">Search from {publishedProducts.length} published products</p>
                </div>
              </button>
            )}

            {/* Search picker (inline, not a modal) */}
            {isPickerOpen && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white">
                {/* Search input */}
                <div className="p-3 border-b bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Search by name, category, or slug..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-10 h-10 border-none bg-white rounded-xl text-sm focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-72 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mb-2 text-slate-200" />
                      <p className="text-xs font-bold">No products match</p>
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 transition-colors border-b border-slate-50 last:border-none text-left"
                      >
                        {product.image && (
                          <div className="relative h-12 w-9 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate leading-tight">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ₹{product.price.toLocaleString()}
                            {product.originalPrice && (
                              <span className="line-through ml-1.5 opacity-50">₹{product.originalPrice.toLocaleString()}</span>
                            )}
                            {' · '}
                            <span className="text-primary">{product.category}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {product.isNew && <Badge className="text-[8px] uppercase bg-accent/20 text-accent-foreground border-none rounded-full px-1.5">New</Badge>}
                          {product.isBestseller && <Badge className="text-[8px] uppercase bg-primary/10 text-primary border-none rounded-full px-1.5">Best</Badge>}
                          {product.isSale && <Badge className="text-[8px] uppercase bg-red-50 text-red-500 border-none rounded-full px-1.5">Sale</Badge>}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Close picker */}
                <div className="p-3 border-t bg-slate-50">
                  <Button variant="ghost" size="sm" onClick={() => setIsPickerOpen(false)} className="w-full rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Headline override */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Custom Headline <span className="text-muted-foreground font-normal normal-case">(optional)</span>
            </Label>
            <Input
              placeholder="Leave blank to use the product's own name"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
            />
            <p className="text-[10px] text-muted-foreground">Override the product name with a marketing headline for the homepage.</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedProduct}
            className="h-12 px-10 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Info strip */}
      {selectedProduct && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700">Stored as Firestore Document ID</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              The reference uses the product&apos;s stable Firestore ID (<span className="font-mono text-primary">{selectedProduct.id}</span>) — it won&apos;t break if the product name or slug changes later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
