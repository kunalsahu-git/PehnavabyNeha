
'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Layers,
  ChevronRight,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/store-data';
import { Badge } from '@/components/ui/badge';

export default function CategoriesAdminPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Product Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your products into logical sections for easy browsing.</p>
        </div>
        <Button className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Create New Category
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="outline" className="border-white/20 text-white text-[10px] font-bold uppercase">Active</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Total Categories</p>
              <h3 className="text-4xl font-headline font-bold">{CATEGORIES.length}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Products / Category</p>
              <h3 className="text-4xl font-headline font-bold">12</h3>
            </div>
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-3xl group bg-slate-900">
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent z-10" />
           <div className="p-8 relative z-20 h-full flex flex-col justify-between">
              <h4 className="text-lg font-headline font-bold text-white uppercase tracking-widest leading-snug">Need a custom <br /> organization structure?</h4>
              <Button variant="link" className="text-accent font-bold p-0 text-[10px] uppercase tracking-[0.2em] w-fit">
                Consult Brand Strategist <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
           </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {CATEGORIES.map((category) => (
          <Card key={category.slug} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-500 bg-white">
            <div className="relative h-48 w-full overflow-hidden">
              <Image 
                src={category.bannerImage} 
                alt={category.name} 
                fill 
                className="object-cover transition-transform duration-1000 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-primary">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 hover:bg-red-500 hover:text-white">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-4 left-6">
                <Badge className="bg-accent text-slate-900 rounded-full font-bold text-[9px] uppercase tracking-widest px-3 border-none shadow-lg">
                  {category.slug}
                </Badge>
              </div>
            </div>
            <CardContent className="p-8 space-y-4">
              <div className="space-y-2">
                <h3 className="text-2xl font-headline font-bold uppercase tracking-tight group-hover:text-primary transition-colors leading-none">
                  {category.name}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Products:</span>
                  <span className="text-sm font-bold text-slate-900">14</span>
                </div>
                <Button variant="ghost" className="text-[10px] font-bold uppercase tracking-widest gap-2 group/link">
                  View Live <ExternalLink className="h-3 w-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
