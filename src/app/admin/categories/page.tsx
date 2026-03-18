'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  ExternalLink,
  Loader2,
  ImageOff,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import {
  getAllCategoriesQuery,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryData,
} from '@/firebase/firestore/categories';
import { ImageUploader } from '@/components/ImageUploader';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  longDescription: '',
  imageUrl: '',
  published: true,
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CategoriesAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WithId<CategoryData> | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<WithId<CategoryData> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return getAllCategoriesQuery(db);
  }, [db]);

  const { data: categories, isLoading } = useCollection<CategoryData>(categoriesQuery);

  const filtered = (categories ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = (categories ?? []).filter(c => c.published).length;

  useEffect(() => {
    if (!slugManuallyEdited && form.name) {
      setForm(prev => ({ ...prev, slug: slugify(form.name) }));
    }
  }, [form.name, slugManuallyEdited]);

  function openCreate() {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setIsSheetOpen(true);
  }

  function openEdit(cat: WithId<CategoryData>) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      longDescription: cat.longDescription ?? '',
      imageUrl: cat.imageUrl ?? '',
      published: cat.published ?? true,
    });
    setSlugManuallyEdited(true);
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingCategory(null);
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ variant: 'destructive', title: 'Required fields missing', description: 'Name and slug are required.' });
      return;
    }
    setIsSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(db, editingCategory.id, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          longDescription: form.longDescription.trim(),
          imageUrl: form.imageUrl.trim(),
          published: form.published,
        });
        toast({ title: 'Category Updated', description: `"${form.name}" has been saved.` });
      } else {
        await createCategory(db, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          longDescription: form.longDescription.trim(),
          imageUrl: form.imageUrl.trim(),
          published: form.published,
        });
        toast({ title: 'Category Created', description: `"${form.name}" is now live.` });
      }
      closeSheet();
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save category to Firestore.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategory(db, deletingCategory.id);
      toast({ title: 'Category Deleted', description: `"${deletingCategory.name}" has been removed.` });
      setDeletingCategory(null);
    } catch {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete category.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Product Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your products into logical sections for easy browsing.</p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Layers className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="outline" className="border-white/20 text-white text-[10px] font-bold uppercase">Live</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Active Categories</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : activeCount}</h3>
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Categories</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : (categories ?? []).length}</h3>
            </div>
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          <div className="relative space-y-2">
            <h4 className="text-lg font-headline font-bold text-white uppercase tracking-widest leading-snug">
              Categories drive<br />product discovery
            </h4>
            <p className="text-xs text-white/50 leading-relaxed">Each category creates a dedicated browse page on the storefront.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-xs"
        />
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <Layers className="h-12 w-12 mb-4 text-slate-200" />
          <p className="text-sm font-bold">{search ? 'No categories match your search' : 'No categories yet'}</p>
          {!search && <p className="text-xs mt-1">Click "Create New Category" to get started.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(cat => (
            <Card key={cat.id} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-500 bg-white">
              {/* Banner Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageOff className="h-8 w-8 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                {/* Action buttons on hover */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(cat)}
                    className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-primary"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeletingCategory(cat)}
                    className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Slug badge */}
                <div className="absolute bottom-4 left-6">
                  <Badge className={cn(
                    'rounded-full font-bold text-[9px] uppercase tracking-widest px-3 border-none shadow-lg',
                    cat.published ? 'bg-accent text-slate-900' : 'bg-slate-600 text-white'
                  )}>
                    {cat.published ? cat.slug : 'Draft'}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-8 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-bold uppercase tracking-tight group-hover:text-primary transition-colors leading-none">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    /{cat.slug}
                  </p>
                  <Link
                    href={`/shop/${cat.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                  >
                    View Live <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={open => { if (!open) closeSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <div className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
              {editingCategory ? 'Editing Category' : 'New Category'}
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">
              {editingCategory ? editingCategory.name : 'Create Category'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingCategory
                ? 'Update the details below and save.'
                : 'Fill in the details to create a new product category.'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Ethnic Sets"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                URL Slug <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium shrink-0">/shop/</span>
                <Input
                  placeholder="ethnic-sets"
                  value={form.slug}
                  onChange={e => {
                    setSlugManuallyEdited(true);
                    setForm(prev => ({ ...prev, slug: slugify(e.target.value) }));
                  }}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-mono text-sm"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Short Description
              </Label>
              <textarea
                placeholder="A one-liner shown under the category name..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[80px] rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Long Description */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Long Description <span className="text-slate-400 normal-case font-normal">(shown on category page, supports HTML)</span>
              </Label>
              <textarea
                placeholder="<p>Detailed description with rich text...</p>"
                value={form.longDescription}
                onChange={e => setForm(prev => ({ ...prev, longDescription: e.target.value }))}
                className="w-full min-h-[120px] rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm font-mono outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Banner Image */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Banner Image
              </Label>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
                folder="pehnava/categories"
              />
            </div>

            <Separator />

            {/* Published */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-sm font-bold uppercase tracking-tight">Published</p>
                <p className="text-[10px] text-muted-foreground">Visible to customers on the storefront</p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={v => setForm(prev => ({ ...prev, published: v }))}
              />
            </div>
          </div>

          <SheetFooter className="pt-6 border-t gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={closeSheet}
              className="flex-1 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={open => { if (!open) setDeletingCategory(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl uppercase">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete <span className="font-bold text-foreground">"{deletingCategory?.name}"</span>. Products in this category will not be deleted but will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-500 hover:bg-red-600 font-bold uppercase text-[10px] tracking-widest h-12"
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
