'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ALL_PRODUCTS, Product } from '@/lib/store-data';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ isOpen, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const filtered = ALL_PRODUCTS.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    setResults(filtered);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 border-none bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for sarees, kurtas, jewellery..."
              className="pl-10 h-12 text-lg border-none focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/60"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] md:max-h-[70vh]">
          {query.trim() !== '' ? (
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Products ({results.length})
                </h3>
                {results.length > 0 && (
                  <Button variant="link" className="text-[10px] font-bold uppercase tracking-widest h-auto p-0 text-primary">
                    View All
                  </Button>
                )}
              </div>
              
              {results.length > 0 ? (
                <div className="grid gap-2">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-secondary/60 transition-all group active:scale-[0.98]"
                    >
                      <div className="relative h-20 w-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0 shadow-sm">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-primary transition-colors font-headline">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-accent font-bold uppercase tracking-wider mt-0.5">
                          {product.category}
                        </p>
                        <p className="text-xs font-bold text-primary mt-2">
                          ₹{product.price.toLocaleString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm">
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-2">
                    <Search className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">No results found for "{query}"</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Try searching for styles, fabrics, or colors</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 space-y-10">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Popular Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {['Sarees', 'Ethnic Sets', 'Jewellery', 'New Arrivals', 'Sale'].map((cat) => (
                    <Button
                      key={cat}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-[10px] font-bold uppercase tracking-widest px-6 h-9 border-primary/10 hover:border-primary hover:bg-primary/5 transition-all"
                      onClick={() => setQuery(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Trending Now</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ALL_PRODUCTS.filter(p => p.isBestseller).slice(0, 4).map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 transition-colors group"
                    >
                      <div className="h-14 w-11 relative rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                        <Image src={product.image} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate group-hover:text-primary transition-colors font-headline">{product.name}</p>
                        <p className="text-[10px] font-bold text-primary mt-1">₹{product.price.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-primary/5">
                <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-[0.4em]">
                  Luxury South Asian Fashion • Pehnava by Neha
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
