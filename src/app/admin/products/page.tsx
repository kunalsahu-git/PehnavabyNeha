'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye,
  Package, Sparkles, Loader2, Upload, X, Check
} from 'lucide-react';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/cloudinary';
import {
  createProduct, updateProduct, deleteProduct, formatProductDate,
  slugify, CATEGORY_SLUG_MAP, SIZE_OPTIONS, type ProductData,
} from '@/firebase/firestore/products';

type ProductFormState = {
  name: string;
  slug: string;
  category: string;
  price: string;
  originalPrice: string;
  fabric: string;
  description: string;
  details: string;
  colors: string;
  sizes: string[];
  isNew: boolean;
  isSale: boolean;
  isBestseller: boolean;
  published: boolean;
  stock: string;
  images: string[];
};

const DEFAULT_FORM: ProductFormState = {
  name: '', slug: '', category: 'Ethnic Sets', price: '', originalPrice: '',
  fabric: 'Silk', description: '', details: '', colors: '', sizes: [],
  isNew: false, isSale: false, isBestseller: false, published: false,
  stock: '', images: [],
};

function productToForm(p: WithId<ProductData>): ProductFormState {
  return {
    name: p.name,
    slug: p.slug,
    category: p.category,
    price: p.price.toString(),
    originalPrice: p.originalPrice?.toString() ?? '',
    fabric: p.fabric ?? '',
    description: p.description ?? '',
    details: (p.details ?? []).join('\n'),
    colors: (p.colors ?? []).join(', '),
    sizes: p.sizes ?? [],
    isNew: p.isNew ?? false,
    isSale: p.isSale ?? false,
    isBestseller: p.isBestseller ?? false,
    published: p.published ?? false,
    stock: p.stock?.toString() ?? '',
    images: p.images ?? (p.image ? [p.image] : []),
  };
}

export default function ProductsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>(DEFAULT_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number>(0);

  // Real-time Firestore subscription
  const productsQuery = useMemoFirebase(
    () => query(collection(db, 'products'), orderBy('createdAt', 'desc')),
    [db]
  );
  const { data: products, isLoading } = useCollection<ProductData>(productsQuery);

  const filteredProducts = (products ?? []).filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const set = (key: keyof ProductFormState, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleSize = (size: string) =>
    set('sizes', form.sizes.includes(size)
      ? form.sizes.filter(s => s !== size)
      : [...form.sizes, size]
    );

  const openAdd = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setSheetOpen(true);
  };

  const openEdit = (product: WithId<ProductData>) => {
    setEditingId(product.id);
    setForm(productToForm(product));
    setSheetOpen(true);
  };

  // Cloudinary upload
  const handleImageUpload = async (file: File, index: number) => {
    setUploadingIndex(index);
    try {
      const url = await uploadImage(file);
      const newImages = [...form.images];
      if (index < newImages.length) newImages[index] = url;
      else newImages.push(url);
      set('images', newImages);
      toast({ title: 'Image uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeImage = (index: number) =>
    set('images', form.images.filter((_, i) => i !== index));

  // AI description
  const handleGenerateAI = async () => {
    if (!form.name) {
      toast({ title: 'Name required', description: 'Enter a product name first.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({
        productName: form.name,
        category: form.category,
        fabric: form.fabric,
        features: form.details.split('\n').filter(Boolean),
        tone: 'luxurious, editorial, heritage',
      });
      set('description', result.description);
      toast({ title: 'AI Magic Ready!' });
    } catch {
      toast({ title: 'AI Error', description: 'Could not generate description.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save
  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: 'Required fields missing', description: 'Name and price are required.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Omit<ProductData, 'createdAt' | 'updatedAt'> = {
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        category: form.category,
        categorySlug: CATEGORY_SLUG_MAP[form.category] ?? slugify(form.category),
        price: parseFloat(form.price),
        ...(form.originalPrice && { originalPrice: parseFloat(form.originalPrice) }),
        image: form.images[0] ?? '',
        images: form.images,
        description: form.description,
        details: form.details.split('\n').map(d => d.trim()).filter(Boolean),
        colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
        sizes: form.sizes,
        fabric: form.fabric,
        isNew: form.isNew,
        isSale: form.isSale,
        isBestseller: form.isBestseller,
        published: form.published,
        ...(form.stock && { stock: parseInt(form.stock) }),
      };

      if (editingId) {
        await updateProduct(db, editingId, payload);
        toast({ title: 'Product updated', description: `${form.name} saved.` });
      } else {
        await createProduct(db, payload);
        toast({ title: 'Product added', description: `${form.name} published to catalog.` });
      }
      setSheetOpen(false);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProduct(db, deletingId);
      toast({ title: 'Product deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Product Catalog</h1>
          <p className="text-sm text-muted-foreground">Manage your boutique inventory, pricing, and visibility.</p>
        </div>
        <Button onClick={openAdd} className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20">
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-100 gap-2 font-bold text-[10px] uppercase tracking-widest">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-50">
                <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 py-6">Product</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Created</TableHead>
                <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 shadow-sm border border-slate-100">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate text-slate-900 font-headline group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">/{product.slug}</span>
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
                    <div className="flex flex-col gap-1">
                      {product.isSale && <Badge className="bg-amber-100 text-amber-700 rounded-full px-2 text-[9px] font-bold uppercase w-fit">Sale</Badge>}
                      {product.isNew && <Badge className="bg-blue-100 text-blue-700 rounded-full px-2 text-[9px] font-bold uppercase w-fit">New</Badge>}
                      {product.isBestseller && <Badge className="bg-purple-100 text-purple-700 rounded-full px-2 text-[9px] font-bold uppercase w-fit">Best</Badge>}
                      {!product.isSale && !product.isNew && !product.isBestseller && (
                        <Badge className="bg-slate-100 text-slate-500 rounded-full px-2 text-[9px] font-bold uppercase w-fit">Standard</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`w-2.5 h-2.5 rounded-full ${product.published ? 'bg-green-500' : 'bg-slate-300'}`} title={product.published ? 'Live on store' : 'Draft'} />
                  </TableCell>
                  <TableCell className="text-[11px] font-medium text-slate-500">
                    {formatProductDate(product.createdAt)}
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
                        <DropdownMenuItem asChild className="rounded-lg gap-2 cursor-pointer">
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <Eye className="h-4 w-4 text-slate-400" /> <span className="text-xs font-medium">View on Site</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => openEdit(product)}>
                          <Edit2 className="h-4 w-4 text-slate-400" /> <span className="text-xs font-medium">Edit Product</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem
                          className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => setDeletingId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" /> <span className="text-xs font-bold">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-slate-200" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold">{searchTerm ? 'No products found' : 'No products yet'}</p>
                        <p className="text-xs text-muted-foreground">
                          {searchTerm ? 'Try a different search term.' : 'Add your first product to get started.'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button onClick={openAdd} variant="outline" className="rounded-full h-10 px-6 font-bold uppercase text-[10px] tracking-widest border-slate-200">
                          Add First Product
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline uppercase tracking-wider">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-full bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto no-scrollbar">
          <SheetHeader className="pb-6 border-b">
            <div className="flex items-center gap-2 text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
              {editingId ? <Edit2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />} Boutique Catalog
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">
              {editingId ? 'Edit Product' : 'Add New Piece'}
            </SheetTitle>
            <SheetDescription className="text-xs">Curate your collection with luxury South Asian fashion.</SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-8">
            {/* Name + Slug */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Name *</Label>
                <Input
                  placeholder="e.g. Ivory Hand-painted Anarkali"
                  className="h-12 rounded-xl"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL Slug (auto-generated)</Label>
                <Input
                  placeholder="auto-generated-from-name"
                  className="h-12 rounded-xl font-mono text-sm text-muted-foreground"
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                />
              </div>
            </div>

            {/* Category, Fabric, Price, Original Price, Stock, Colors */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                <select
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {Object.keys(CATEGORY_SLUG_MAP).map(cat => <option key={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fabric</Label>
                <Input
                  placeholder="e.g. Mulberry Silk"
                  className="h-12 rounded-xl"
                  value={form.fabric}
                  onChange={(e) => set('fabric', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price (₹) *</Label>
                <Input
                  type="number"
                  placeholder="2999"
                  className="h-12 rounded-xl"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="For sale items"
                  className="h-12 rounded-xl"
                  value={form.originalPrice}
                  onChange={(e) => set('originalPrice', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stock Qty</Label>
                <Input
                  type="number"
                  placeholder="Blank = unlimited"
                  className="h-12 rounded-xl"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Colors (comma-sep)</Label>
                <Input
                  placeholder="Red, Gold, Ivory"
                  className="h-12 rounded-xl"
                  value={form.colors}
                  onChange={(e) => set('colors', e.target.value)}
                />
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available Sizes</Label>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-4 h-10 rounded-md text-xs font-bold border transition-all ${
                      form.sizes.includes(size)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4">
              {([
                ['isNew', 'New Arrival'],
                ['isSale', 'On Sale'],
                ['isBestseller', 'Bestseller'],
                ['published', 'Published (Live on Store)'],
              ] as [keyof ProductFormState, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">{label}</Label>
                  <Switch
                    checked={form[key] as boolean}
                    onCheckedChange={(v) => set(key, v)}
                  />
                </div>
              ))}
            </div>

            {/* Images */}
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Product Images · Cloudinary CDN
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, uploadTargetIndex);
                  e.target.value = '';
                }}
              />
              <div className="grid grid-cols-4 gap-4">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-200 group">
                    <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-primary/80 text-white px-2 py-0.5 rounded">MAIN</span>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setUploadTargetIndex(form.images.length);
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingIndex !== null}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-primary/40 cursor-pointer bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {uploadingIndex !== null ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 text-slate-400" />
                      <span className="text-[8px] font-bold uppercase text-slate-400">Add Image</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">First image = main display image. Recommended: 3:4 ratio, min 600×800px.</p>
            </div>

            {/* AI Description */}
            <div className="space-y-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Boutique AI Scribe
                </Label>
                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  variant="ghost"
                  className="h-8 px-4 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white shadow-sm border border-primary/10 hover:bg-primary hover:text-white"
                >
                  {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                  Generate Luxe Description
                </Button>
              </div>
              <Textarea
                placeholder="Product description that captures the heritage and femininity..."
                className="min-h-[120px] rounded-xl bg-white focus:ring-primary border-none text-xs leading-relaxed"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
              <p className="text-[8px] text-muted-foreground font-medium italic">Powered by Genkit · Tailored for Pehnava by Neha brand voice.</p>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Product Details (one per line)
              </Label>
              <Textarea
                placeholder={"Fabric: Premium Silk\nWork: Hand Embroidery with Zari\nOccasion: Wedding, Festive\nCare: Dry Clean Only"}
                className="min-h-[100px] rounded-xl text-xs"
                value={form.details}
                onChange={(e) => set('details', e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-14 rounded-full font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl"
            >
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> {editingId ? 'Save Changes' : 'Publish to Boutique'}</>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
