
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { ALL_PRODUCTS } from '@/lib/store-data';

export default function ProductsAdminPage() {
  const [searchTerm, setSearchQuery] = useState('');

  const filteredProducts = ALL_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">Manage your boutique inventory, pricing, and visibility.</p>
        </div>
        <Button className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Add New Product
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products by name or category..." 
              className="pl-12 h-12 border-none bg-slate-50 focus-visible:ring-primary/20 rounded-2xl text-sm"
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none rounded-2xl h-12 px-6 border-slate-100 gap-2 font-bold text-[10px] uppercase tracking-widest">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" className="flex-1 md:flex-none rounded-2xl h-12 px-6 border-slate-100 gap-2 font-bold text-[10px] uppercase tracking-widest">
              Bulk Actions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-50">
              <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 py-6">Product Details</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created At</TableHead>
              <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 shadow-sm border border-slate-100">
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate text-slate-900 font-headline group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">SKU: PN-00{product.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest border-slate-200">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">₹{product.price.toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {product.isSale ? (
                        <Badge className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter">Sale Live</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-tighter">Published</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] font-medium text-slate-500">
                    {new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1.5">Manage</DropdownMenuLabel>
                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                          <Eye className="h-4 w-4 text-slate-400" /> <span className="text-xs font-medium">View on Site</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                          <Edit2 className="h-4 w-4 text-slate-400" /> <span className="text-xs font-medium">Edit Product</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="h-4 w-4" /> <span className="text-xs font-bold">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <Package className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">No products found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or add a new piece to the collection.</p>
                    </div>
                    <Button variant="outline" className="rounded-full h-10 px-6 font-bold uppercase text-[10px] tracking-widest border-slate-200">
                      Clear Search
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
