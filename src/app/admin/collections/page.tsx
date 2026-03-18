'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, Tag, ExternalLink,
  Loader2, ImageOff, Grid, Download, MoreVertical,
  Check, X, Eye, BarChart3, Zap,
} from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';
import { BulkActionToolbar } from '@/components/admin/BulkActionToolbar';
import { exportToCSV } from '@/lib/export-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import {
  getAllCollectionsQuery, createCollection, updateCollection, deleteCollection,
  type CollectionData,
} from '@/firebase/firestore/collections';
import { getAllProductsQuery, type ProductData } from '@/firebase/firestore/products';
import { ImageUploader } from '@/components/ImageUploader';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  published: true,
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CollectionsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<WithId<CollectionData> | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<WithId<CollectionData> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Queries
  const collectionsQuery = useMemoFirebase(() => db ? getAllCollectionsQuery(db) : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? getAllProductsQuery(db) : null, [db]);

  const { data: collections, isLoading: isCollLoading } = useCollection<CollectionData>(collectionsQuery);
  const { data: products } = useCollection<ProductData>(productsQuery);

  // Enhanced data with product counts
  const enhancedCollections = useMemo(() => {
    if (!collections) return [];
    return collections.map(coll => ({
      ...coll,
      productCount: (products ?? []).filter(p => p.collections?.includes(coll.slug)).length
    }));
  }, [collections, products]);

  const {
    searchTerm, setSearchTerm,
    filteredData,
    toggleSort, sortConfig,
    selectedIds, toggleSelect, toggleSelectAll, setSelectedIds
  } = useDataTable<WithId<CollectionData & { productCount: number }>>({
    data: enhancedCollections,
    searchFields: ['name', 'slug', 'description'],
    initialSort: { key: 'name', direction: 'asc' }
  });

  const activeCount = (collections ?? []).filter(c => c.published).length;

  useEffect(() => {
    if (!slugManuallyEdited && form.name) {
      setForm(prev => ({ ...prev, slug: slugify(form.name) }));
    }
  }, [form.name, slugManuallyEdited]);

  const openCreate = () => {
    setEditingCollection(null);
    setForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setIsSheetOpen(true);
  };

  const openEdit = (coll: WithId<CollectionData>) => {
    setEditingCollection(coll);
    setForm({
      name: coll.name,
      slug: coll.slug,
      description: coll.description ?? '',
      imageUrl: coll.imageUrl ?? '',
      published: coll.published ?? true,
    });
    setSlugManuallyEdited(true);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setEditingCollection(null);
  };

  const handleSave = async () => {
    if (!db || !form.name.trim() || !form.slug.trim()) return;
    setIsSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        published: form.published,
      };
      if (editingCollection) {
        await updateCollection(db, editingCollection.id, data);
        toast({ title: 'Collection Updated' });
      } else {
        await createCollection(db, data);
        toast({ title: 'Collection Created' });
      }
      closeSheet();
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!db || !deletingCollection) return;
    setIsDeleting(true);
    try {
      await deleteCollection(db, deletingCollection.id);
      toast({ title: 'Collection Deleted' });
      setDeletingCollection(null);
    } catch {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!db || selectedIds.size === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteCollection(db, id)));
      toast({ title: 'Bulk Delete Success', description: `Deleted ${selectedIds.size} collections.` });
      setSelectedIds(new Set());
    } catch {
      toast({ variant: 'destructive', title: 'Bulk delete failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(c => ({
      Name: c.name,
      Slug: c.slug,
      Products: c.productCount,
      Status: c.published ? 'Published' : 'Draft',
    }));
    exportToCSV(exportData, 'pehnava_collections');
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Collections</h1>
          <p className="text-sm text-muted-foreground">Thematic groupings for marketing and seasonal campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 border-slate-200">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button onClick={openCreate} className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" /> Create New
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Collections</p>
              <h3 className="text-3xl font-headline font-bold">{isCollLoading ? '—' : activeCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Grid className="h-7 w-7 text-accent" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Collections</p>
              <h3 className="text-3xl font-headline font-bold">{isCollLoading ? '—' : (collections ?? []).length}</h3>
            </div>
          </CardContent>
        </Card>
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 flex items-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
          <div className="relative space-y-1">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest uppercase">Growth Tip</p>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight leading-snug">
               Use "Seasonal" or "Trending" collections to drive higher conversion rates.
            </h4>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search & Bulk */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <BulkActionToolbar 
            selectedCount={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
            actions={[
              { label: 'Delete Selected', icon: <Trash2 className="h-3 w-3" />, onClick: handleBulkDelete, variant: 'destructive' }
            ]}
          />
        </div>

        {/* Table */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          {isCollLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-50">
                  <TableHead className="w-12 px-8">
                    <Checkbox 
                      checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                      onCheckedChange={() => toggleSelectAll()}
                      className="rounded-md border-slate-300"
                    />
                  </TableHead>
                  <TableHead className="w-16 py-6"></TableHead>
                  <TableHead 
                    className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    onClick={() => toggleSort('name')}
                  >
                    Collection {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Slug</TableHead>
                  <TableHead 
                    className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    onClick={() => toggleSort('productCount')}
                  >
                    Products {sortConfig.key === 'productCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? filteredData.map(coll => (
                  <TableRow key={coll.id} className={cn(
                    "hover:bg-slate-50/50 border-slate-50 transition-colors group",
                    selectedIds.has(coll.id) && "bg-primary/5 hover:bg-primary/5"
                  )}>
                    <TableCell className="px-8">
                      <Checkbox 
                        checked={selectedIds.has(coll.id)}
                        onCheckedChange={() => toggleSelect(coll.id)}
                        className="rounded-md border-slate-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative h-12 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        {coll.imageUrl ? (
                          <Image src={coll.imageUrl} alt={coll.name} fill className="object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-slate-300 m-auto mt-4" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{coll.name}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px] font-medium">{coll.description || 'No description'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md w-fit">
                        /{coll.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <BarChart3 className="h-3 w-3 text-slate-400" />
                        {coll.productCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={coll.published ? 'default' : 'secondary'} className={cn(
                        "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none",
                        coll.published ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {coll.published ? 'Active' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(coll)} className="h-9 w-9 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Link href={`/collections/${coll.slug}`} target="_blank">
                          <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-slate-100">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="ghost" onClick={() => setDeletingCollection(coll)} className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                     <TableCell colSpan={7} className="h-64 text-center text-muted-foreground text-sm">
                      No collections found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Edit/Create Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={open => { if (!open) closeSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto no-scrollbar">
          <SheetHeader className="pb-6 border-b">
            <div className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
              {editingCollection ? 'Modify Collection' : 'Fresh Collection'}
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">
              {editingCollection ? editingCollection.name : 'Creation'}
            </SheetTitle>
          </SheetHeader>

          <div className="py-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Collection Name</Label>
              <Input
                placeholder="e.g. Wedding Edit"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">URL Slug</Label>
              <Input
                placeholder="wedding-edit"
                value={form.slug}
                onChange={e => {
                  setSlugManuallyEdited(true);
                  setForm(f => ({ ...f, slug: slugify(e.target.value) }));
                }}
                className="h-12 rounded-xl font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full min-h-[100px] rounded-2xl border bg-slate-50/50 p-4 text-xs font-medium resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Story about this collection..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cover Image</Label>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(f => ({ ...f, imageUrl: url }))}
                folder="collections"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase">Published Status</p>
                <p className="text-[10px] text-muted-foreground font-medium">Controls visibility on the website</p>
              </div>
              <Switch checked={form.published} onCheckedChange={v => setForm(f => ({ ...f, published: v }))} />
            </div>
          </div>

          <SheetFooter className="gap-3 sticky bottom-0 bg-white pt-4 border-t">
            <Button variant="outline" onClick={closeSheet} className="flex-1 rounded-xl h-12 uppercase text-[10px] font-bold tracking-widest">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-xl h-12 uppercase text-[10px] font-bold tracking-widest">
              {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              {editingCollection ? 'Save' : 'Create'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingCollection} onOpenChange={open => !open && setDeletingCollection(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline uppercase tracking-wider">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete "{deletingCollection?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-red-500 hover:bg-red-600 font-bold uppercase text-[10px] tracking-widest h-12">
              {isDeleting && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
