'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Tag,
  ChevronRight,
  ExternalLink,
  Zap,
  Grid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MOCK_COLLECTIONS = [
  { id: '1', name: 'New Arrivals', slug: 'new-arrivals', products: 12, status: 'Active', image: 'https://picsum.photos/seed/new/600/400' },
  { id: '2', name: 'Festive Wedding Edit', slug: 'festive-wedding', products: 8, status: 'Active', image: 'https://picsum.photos/seed/festive/600/400' },
  { id: '3', name: 'Summer Florals', slug: 'summer-florals', products: 15, status: 'Scheduled', image: 'https://picsum.photos/seed/summer/600/400' },
  { id: '4', name: 'The Silk Story', slug: 'silk-story', products: 6, status: 'Active', image: 'https://picsum.photos/seed/silk/600/400' },
];

export default function CollectionsAdminPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Marketing Collections</h1>
          <p className="text-sm text-muted-foreground">Group products for thematic campaigns and featured sections.</p>
        </div>
        <Button className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Create New Collection
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Campaigns</p>
              <h3 className="text-3xl font-headline font-bold">3 Collections</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Grid className="h-7 w-7 text-accent" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Items / Coll</p>
              <h3 className="text-3xl font-headline font-bold">10 Products</h3>
            </div>
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-3xl group bg-slate-900 flex items-center p-8">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent z-10" />
           <div className="relative z-20 flex-1 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest">Seasonal Strategy</h4>
              <p className="text-xs text-white/60 leading-relaxed max-w-[200px]">Next: Winter Velvet Collection is scheduled for Oct 15th.</p>
           </div>
           <Button size="icon" className="relative z-20 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white">
              <ChevronRight className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search collections..." 
          className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-xs"
        />
      </div>

      {/* Collections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_COLLECTIONS.map((collection) => (
          <Card key={collection.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-xl transition-all duration-500">
            <CardContent className="p-0 flex flex-col sm:flex-row h-full">
              <div className="relative w-full sm:w-48 aspect-[4/3] sm:aspect-square overflow-hidden shrink-0">
                <Image 
                  src={collection.image} 
                  alt={collection.name} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-3 left-3">
                  <Badge className={cn(
                    "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border-none",
                    collection.status === 'Active' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {collection.status}
                  </Badge>
                </div>
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-headline font-bold uppercase group-hover:text-primary transition-colors">{collection.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL Slug: /{collection.slug}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><Tag className="h-3 w-3" /> {collection.products} Products</span>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className="flex items-center gap-1.5"><ExternalLink className="h-3 w-3" /> View Live</span>
                  </div>
                </div>
                <div className="pt-6 border-t mt-6 flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-slate-100">
                    <Edit2 className="h-3 w-3 mr-2" /> Edit Details
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-slate-100 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3 w-3 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
