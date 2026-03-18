'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  ExternalLink,
  Zap,
  Grid,
  Loader2,
  ImageOff,
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
import Link from 'next/link';
import {
  getAllCollectionsQuery,
  createCollection,
  updateCollection,
  deleteCollection,
  type CollectionData,
} from '@/firebase/firestore/collections';
import { ImageUploader } from '@/components/ImageUploader';

const EMPTY_FORM = { name: '', slug: '', description: '', imageUrl: '', published: true };

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CollectionsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<WithId<CollectionData> | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<WithId<CollectionData> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const collectionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return getAllCollectionsQuery(db);
  }, [db]);

  const { data: collections, isLoading } = useCollection<CollectionData>(collectionsQuery);

  const filtered = (collections ?? []).filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = (collections ?? []).filter(c => c.published).length;

  // Auto-generate slug from name unless manually edited
  useEffect(() => {
    if (!slugManuallyEdited && form.name) {
      setForm(prev => ({ ...prev, slug: slugify(form.name) }));
    }
  }, [form.name, slugManuallyEdited]);

  function openCreate() {
    setEditingCollection(null);
    setForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setIsSheetOpen(true);
  }

  function openEdit(col: WithId<CollectionData>) {
    setEditingCollection(col);
    setForm({
      name: col.name,
      slug: col.slug,
      description: col.description ?? '',
      imageUrl: col.imageUrl ?? '',
      published: col.published ?? true,
    });
    setSlugManuallyEdited(true);
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingCollection(null);
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ variant: 'destructive', title: 'Required fields missing', description: 'Name and slug are required.' });
      return;
    }
    setIsSaving(true);
    try {
      if (editingCollection) {
        await updateCollection(db, editingCollection.id, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          published: form.published,
        });
        toast({ title: 'Collection Updated', description: `"${form.name}" has been saved.` });
      } else {
        await createCollection(db, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim(),
          imageUrl: form.imageUrl.trim(),
          published: form.published,
        });
        toast({ title: 'Collection Created', description: `"${form.name}" is now live.` });
      }
      closeSheet();
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save collection to Firestore.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCollection) return;
    setIsDeleting(true);
    try {
      await deleteCollection(db, deletingCollection.id);
      toast({ title: 'Collection Deleted', description: `"${deletingCollection.name}" has been removed.` });
      setDeletingCollection(null);
    } catch {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete collection.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Marketing Collections</h1>
          <p className="text-sm text-muted-foreground">Group products for thematic campaigns and featured sections.</p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Collection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Collections</p>
              <h3 className="text-3xl font-headline font-bold">{isLoading ? '—' : activeCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Grid className="h-7 w-7 text-accent" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Collections</p>
              <h3 className="text-3xl font-headline font-bold">{isLoading ? '—' : (collections ?? []).length}</h3>
            </div>
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-3xl bg-slate-900 flex items-center p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
          <div className="relative flex-1 space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Quick Tip</h4>
            <p className="text-xs text-white/60 leading-relaxed">Collections appear as curated sections on the storefront homepage.</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search collections..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-xs"
        />
      </div>

      {/* Collections Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <Tag className="h-12 w-12 mb-4 text-slate-200" />
          <p className="text-sm font-bold">{search ? 'No collections match your search' : 'No collections yet'}</p>
          {!search && <p className="text-xs mt-1">Click "Create New Collection" to get started.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(col => (
            <Card key={col.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-xl transition-all duration-500">
              <CardContent className="p-0 flex flex-col sm:flex-row h-full">
                {/* Image */}
                <div className="relative w-full sm:w-48 aspect-[4/3] sm:aspect-square overflow-hidden shrink-0 bg-slate-100">
                  {col.imageUrl ? (
                    <Image
                      src={col.imageUrl}
                      alt={col.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageOff className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-3 left-3">
                    <Badge className={cn(
                      'rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border-none',
                      col.published ? 'bg-green-500 text-white' : 'bg-slate-500 text-white'
                    )}>
                      {col.published ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-headline font-bold uppercase group-hover:text-primary transition-colors leading-tight">
                        {col.name}
                      </h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                        /{col.slug}
                      </p>
                    </div>
                    {col.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{col.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <Link
                        href={`/collections/${col.slug}`}
                        target="_blank"
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" /> View Live
                      </Link>
                    </div>
                  </div>

                  <div className="pt-5 border-t mt-5 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => openEdit(col)}
                      className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-slate-100 hover:border-primary hover:text-primary"
                    >
                      <Edit2 className="h-3 w-3 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeletingCollection(col)}
                      className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-slate-100 text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100"
                    >
                      <Trash2 className="h-3 w-3 mr-2" /> Delete
                    </Button>
                  </div>
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
              {editingCollection ? 'Editing Collection' : 'New Collection'}
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">
              {editingCollection ? editingCollection.name : 'Create Collection'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingCollection ? 'Update the details below and save.' : 'Fill in the details to create a new marketing collection.'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Collection Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Festive Wedding Edit"
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
                <span className="text-xs text-muted-foreground font-medium shrink-0">/collections/</span>
                <Input
                  placeholder="festive-wedding-edit"
                  value={form.slug}
                  onChange={e => {
                    setSlugManuallyEdited(true);
                    setForm(prev => ({ ...prev, slug: slugify(e.target.value) }));
                  }}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-mono text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
              <textarea
                placeholder="A short description shown on the storefront..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[100px] rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cover Image</Label>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
                folder="pehnava/collections"
              />
            </div>

            <Separator />

            {/* Published toggle */}
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
              {isSaving
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : null
              }
              {editingCollection ? 'Save Changes' : 'Create Collection'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCollection} onOpenChange={open => { if (!open) setDeletingCollection(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl uppercase">Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete <span className="font-bold text-foreground">"{deletingCollection?.name}"</span>. This action cannot be undone.
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
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
