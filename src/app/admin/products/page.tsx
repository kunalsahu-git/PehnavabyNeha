'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye,
  Package, Sparkles, Loader2, X, Check, Star, Upload,
} from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/lib/cloudinary';
import {
  getAllProductsQuery, createProduct, updateProduct, deleteProduct,
  formatProductDate, slugify, generateSku, SIZE_OPTIONS, type ProductData,
} from '@/firebase/firestore/products';
import { getAllCategoriesQuery, type CategoryData } from '@/firebase/firestore/categories';
import { getAllCollectionsQuery, type CollectionData } from '@/firebase/firestore/collections';

type ProductFormState = {
  name: string; slug: string; sku: string;
  category: string; categorySlug: string;
  collections: string[];
  price: string; originalPrice: string; fabric: string;
  description: string; details: string; colors: string; sizes: string[];
  isNew: boolean; isSale: boolean; isBestseller: boolean;
  published: boolean; stock: string; images: string[];
};

const DEFAULT_FORM: ProductFormState = {
  name: '', slug: '', sku: '',
  category: '', categorySlug: '',
  collections: [],
  price: '', originalPrice: '', fabric: '',
  description: '', details: '', colors: '', sizes: [],
  isNew: false, isSale: false, isBestseller: false,
  published: false, stock: '', images: [],
};

function productToForm(p: WithId<ProductData>): ProductFormState {
  return {
    name: p.name, slug: p.slug, sku: p.sku ?? '',
    category: p.category, categorySlug: p.categorySlug,
    collections: p.collections ?? [],
    price: p.price.toString(), originalPrice: p.originalPrice?.toString() ?? '',
    fabric: p.fabric ?? '', description: p.description ?? '',
    details: (p.details ?? []).join('\n'),
    colors: (p.colors ?? []).join(', '),
    sizes: p.sizes ?? [],
    isNew: p.isNew ?? false, isSale: p.isSale ?? false,
    isBestseller: p.isBestseller ?? false, published: p.published ?? false,
    stock: p.stock?.toString() ?? '',
    images: p.images?.length ? p.images : (p.image ? [p.image] : []),
  };
}

export default function ProductsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [form, setForm] = useState<ProductFormState>(DEFAULT_FORM);

  // Live data
  const productsQuery = useMemoFirebase(() => db ? getAllProductsQuery(db) : null, [db]);
  const { data: products, isLoading } = useCollection<ProductData>(productsQuery);

  const categoriesQuery = useMemoFirebase(() => db ? getAllCategoriesQuery(db) : null, [db]);
  const { data: allCategories } = useCollection<CategoryData>(categoriesQuery);
  const publishedCategories = (allCategories ?? []).filter(c => c.published);

  const collectionsQuery = useMemoFirebase(() => db ? getAllCollectionsQuery(db) : null, [db]);
  const { data: allCollections } = useCollection<CollectionData>(collectionsQuery);
  const publishedCollections = (allCollections ?? []).filter(c => c.published);

  const filteredProducts = (products ?? []).filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const set = (key: keyof ProductFormState, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const toggleSize = (size: string) =>
    set('sizes', form.sizes.includes(size)
      ? form.sizes.filter(s => s !== size)
      : [...form.sizes, size]
    );

  const toggleCollection = (slug: string) =>
    set('collections', form.collections.includes(slug)
      ? form.collections.filter(s => s !== slug)
      : [...form.collections, slug]
    );

  const handleCategoryChange = (name: string) => {
    const cat = publishedCategories.find(c => c.name === name);
    setForm(f => ({ ...f, category: name, categorySlug: cat?.slug ?? slugify(name) }));
  };

  const openAdd = () => {
    setEditingId(null);
    const firstCat = publishedCategories[0];
    setForm({ ...DEFAULT_FORM, category: firstCat?.name ?? '', categorySlug: firstCat?.slug ?? '', sku: generateSku('NEW') });
    setSheetOpen(true);
  };

  const openEdit = (product: WithId<ProductData>) => {
    setEditingId(product.id);
    setForm(productToForm(product));
    setSheetOpen(true);
  };

  // Upload multiple files concurrently
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    if (imageFiles.length > 10) {
      toast({ variant: 'destructive', title: 'Too many files', description: 'Upload up to 10 images at a time.' });
      return;
    }
    setUploadingCount(imageFiles.length);
    try {
      const urls = await Promise.all(imageFiles.map(f => uploadImage(f, 'pehnava/products')));
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      toast({ variant: 'destructive', title: 'Upload failed', description: 'One or more images could not be uploaded.' });
    } finally {
      setUploadingCount(0);
    }
  };

  // Set any image as main by moving it to index 0
  const setMainImage = (idx: number) => {
    if (idx === 0) return;
    setForm(f => {
      const imgs = [...f.images];
      const [main] = imgs.splice(idx, 1);
      return { ...f, images: [main, ...imgs] };
    });
  };

  const removeImage = (idx: number) =>
    set('images', form.images.filter((_, i) => i !== idx));

  const handleGenerateAI = async () => {
    if (!form.name) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Enter a product name first.' });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({
        productName: form.name, category: form.category,
        fabric: form.fabric,
        features: form.details.split('\n').filter(Boolean),
        tone: 'luxurious, editorial, heritage',
      });
      set('description', result.description);
      toast({ title: 'AI description ready!' });
    } catch {
      toast({ variant: 'destructive', title: 'AI Error', description: 'Could not generate description.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      toast({ variant: 'destructive', title: 'Required fields missing', description: 'Name and price are required.' });
      return;
    }
    if (form.originalPrice && parseFloat(form.originalPrice) <= parseFloat(form.price)) {
      toast({ variant: 'destructive', title: 'Invalid pricing', description: 'Original price must be higher than the selling price.' });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Omit<ProductData, 'createdAt' | 'updatedAt'> = {
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        sku: form.sku.trim() || generateSku(form.name),
        category: form.category,
        categorySlug: form.categorySlug || slugify(form.category),
        collections: form.collections,
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
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteProduct(db, deletingId);
      toast({ title: 'Product deleted' });
      setDeletingId(null);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message });
    } finally {
      setIsDeleting(false);
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
              placeholder="Search by name or category..."
              className="pl-12 h-12 border-none bg-slate-50 focus-visible:ring-primary/20 rounded-2xl text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-100 gap-2 font-bold text-[10px] uppercase tracking-widest shrink-0">
            <Filter className="h-4 w-4" />
            {isLoading ? '—' : `${(products ?? []).length} Products`}
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
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Collections</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tags</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Added</TableHead>
                <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? filteredProducts.map(product => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-sm border border-slate-100">
                        {product.image
                          ? <Image src={product.image} alt={product.name} fill className="object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-slate-300" /></div>
                        }
                        {(product.images?.length ?? 0) > 1 && (
                          <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] font-bold px-1 py-0.5 rounded-tl-lg">
                            +{(product.images?.length ?? 1) - 1}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-slate-900 font-headline group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">/{product.slug}</p>
                        {product.sku && (
                          <p className="text-[9px] font-mono text-slate-400 tracking-wider mt-0.5">{product.sku}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest border-slate-200">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(product.collections?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.collections!.slice(0, 2).map(slug => (
                          <Badge key={slug} className="bg-violet-100 text-violet-700 rounded-full px-2 text-[9px] font-bold uppercase border-none">
                            {slug}
                          </Badge>
                        ))}
                        {product.collections!.length > 2 && (
                          <Badge className="bg-slate-100 text-slate-500 rounded-full px-2 text-[9px] font-bold border-none">
                            +{product.collections!.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-medium">—</span>
                    )}
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
                    <div className="flex flex-wrap gap-1">
                      {product.isSale && <Badge className="bg-amber-100 text-amber-700 rounded-full px-2 text-[9px] font-bold uppercase border-none">Sale</Badge>}
                      {product.isNew && <Badge className="bg-blue-100 text-blue-700 rounded-full px-2 text-[9px] font-bold uppercase border-none">New</Badge>}
                      {product.isBestseller && <Badge className="bg-purple-100 text-purple-700 rounded-full px-2 text-[9px] font-bold uppercase border-none">Best</Badge>}
                      {!product.isSale && !product.isNew && !product.isBestseller && (
                        <Badge className="bg-slate-100 text-slate-400 rounded-full px-2 text-[9px] font-bold uppercase border-none">—</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.published ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {product.published ? 'Live' : 'Draft'}
                      </span>
                    </div>
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
                            <Eye className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-medium">View on Site</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => openEdit(product)}>
                          <Edit2 className="h-4 w-4 text-slate-400" />
                          <span className="text-xs font-medium">Edit Product</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-slate-100" />
                        <DropdownMenuItem
                          className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => setDeletingId(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="text-xs font-bold">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
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
      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline uppercase tracking-wider">Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from your catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 h-11 font-bold uppercase text-[10px] tracking-widest"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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

            {/* Name + Slug + SKU */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Name *</Label>
                <Input
                  placeholder="e.g. Ivory Hand-painted Anarkali"
                  className="h-12 rounded-xl"
                  value={form.name}
                  onChange={e => setForm(f => ({
                    ...f,
                    name: e.target.value,
                    slug: slugify(e.target.value),
                    // Auto-generate SKU from name only if it hasn't been manually edited
                    sku: f.sku.startsWith('PNH-') && !editingId ? generateSku(e.target.value) : f.sku,
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL Slug</Label>
                <Input
                  placeholder="auto-generated-from-name"
                  className="h-12 rounded-xl font-mono text-sm text-muted-foreground"
                  value={form.slug}
                  onChange={e => set('slug', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SKU</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="PNH-XXXXX-0000"
                    className="h-12 rounded-xl font-mono text-sm flex-1"
                    value={form.sku}
                    onChange={e => set('sku', e.target.value.toUpperCase())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 rounded-xl border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40 shrink-0"
                    title="Generate a new SKU"
                    onClick={() => set('sku', generateSku(form.name || 'NEW'))}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">Auto-generated. Click ↺ to generate a new one, or type your own.</p>
              </div>
            </div>

            <Separator />

            {/* Category + Collections */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category *</Label>
                <p className="text-[10px] text-slate-400">The product type — used for browse navigation (e.g. /shop/sarees)</p>
                <select
                  className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.category}
                  onChange={e => handleCategoryChange(e.target.value)}
                >
                  <option value="">— Select a category —</option>
                  {publishedCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {publishedCollections.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Collections</Label>
                    <p className="text-[10px] text-slate-400 mt-0.5">Curated editorial groups — a product can appear in multiple (e.g. Bridal 2025, Festive Edit)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {publishedCollections.map(col => (
                      <label
                        key={col.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          form.collections.includes(col.slug)
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                        }`}
                      >
                        <Checkbox
                          checked={form.collections.includes(col.slug)}
                          onCheckedChange={() => toggleCollection(col.slug)}
                          className="rounded-md"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{col.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">/{col.slug}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {form.collections.length > 0 && (
                    <p className="text-[10px] text-primary font-bold">
                      {form.collections.length} collection{form.collections.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Pricing + Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price (₹) *</Label>
                <Input type="number" placeholder="2999" className="h-12 rounded-xl" value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original Price (₹)</Label>
                <Input
                  type="number"
                  placeholder="Must be higher than selling price"
                  className={`h-12 rounded-xl ${form.originalPrice && form.price && parseFloat(form.originalPrice) <= parseFloat(form.price) ? 'border-red-400 focus-visible:ring-red-300' : ''}`}
                  value={form.originalPrice}
                  onChange={e => set('originalPrice', e.target.value)}
                />
                {form.originalPrice && form.price && parseFloat(form.originalPrice) <= parseFloat(form.price) && (
                  <p className="text-[10px] text-red-500 font-bold">Must be greater than selling price (₹{form.price})</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fabric</Label>
                <Input placeholder="e.g. Mulberry Silk" className="h-12 rounded-xl" value={form.fabric} onChange={e => set('fabric', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stock Qty</Label>
                <Input type="number" placeholder="Blank = unlimited" className="h-12 rounded-xl" value={form.stock} onChange={e => set('stock', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Colors (comma-separated)</Label>
                <Input placeholder="Red, Gold, Ivory" className="h-12 rounded-xl" value={form.colors} onChange={e => set('colors', e.target.value)} />
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
                    className={`px-4 h-10 rounded-xl text-xs font-bold border transition-all ${
                      form.sizes.includes(size)
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 gap-3">
              {([
                ['isNew', 'New Arrival'],
                ['isSale', 'On Sale'],
                ['isBestseller', 'Bestseller'],
                ['published', 'Published (Live)'],
              ] as [keyof ProductFormState, string][]).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">{label}</Label>
                  <Switch checked={form[key] as boolean} onCheckedChange={v => set(key, v)} />
                </div>
              ))}
            </div>

            <Separator />

            {/* Images */}
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Product Images
                </Label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Click <Star className="h-2.5 w-2.5 inline-block text-amber-500" /> on any image to set it as the main display photo. Upload multiple at once.
                </p>
              </div>

              {/* Drop zone / upload trigger */}
              <div
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-primary/40 cursor-pointer transition-colors bg-slate-50/50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => { handleFilesSelected(e.target.files); e.target.value = ''; }}
                />
                {uploadingCount > 0 ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-xs font-bold text-primary">Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}…</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-400" />
                    <p className="text-xs font-bold text-slate-500 text-center">Click to upload or drag & drop</p>
                    <p className="text-[10px] text-slate-400 text-center">Select multiple images at once · PNG, JPG, WebP · Up to 10 at a time</p>
                  </>
                )}
              </div>

              {/* Image grid */}
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {form.images.map((url, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-[3/4] rounded-xl overflow-hidden group border-2 transition-all ${
                        idx === 0 ? 'border-primary shadow-md shadow-primary/20' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <Image src={url} alt={`Image ${idx + 1}`} fill className="object-cover" />

                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => setMainImage(idx)}
                            title="Set as main image"
                            className="h-8 w-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-amber-500 transition-colors"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          title="Remove image"
                          className="h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Main badge */}
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[8px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                          <Star className="h-2 w-2" /> MAIN
                        </span>
                      )}
                      {/* Index badge */}
                      {idx > 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-black/40 text-white w-5 h-5 rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

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
                  Generate Description
                </Button>
              </div>
              <Textarea
                placeholder="Product description that captures heritage and femininity..."
                className="min-h-[120px] rounded-xl bg-white focus:ring-primary border-none text-xs leading-relaxed"
                value={form.description}
                onChange={e => set('description', e.target.value)}
              />
              <p className="text-[8px] text-muted-foreground font-medium italic">Powered by Genkit · Tailored for Pehnava by Neha brand voice.</p>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Product Details <span className="normal-case font-normal text-slate-400">(one per line)</span>
              </Label>
              <Textarea
                placeholder={"Fabric: Premium Silk\nWork: Hand Embroidery with Zari\nOccasion: Wedding, Festive\nCare: Dry Clean Only"}
                className="min-h-[100px] rounded-xl text-xs"
                value={form.details}
                onChange={e => set('details', e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="pt-6 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving || uploadingCount > 0}
              className="w-full h-14 rounded-full font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl"
            >
              {isSaving
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                : uploadingCount > 0
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading images...</>
                : <><Check className="h-4 w-4 mr-2" /> {editingId ? 'Save Changes' : 'Publish to Boutique'}</>
              }
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
