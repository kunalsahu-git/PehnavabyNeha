'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus, Edit2, Trash2, Loader2, ImageOff, Images,
  ChevronUp, ChevronDown, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import {
  getAllHeroSlidesQuery, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  reorderHeroSlide, type HeroSlideData,
} from '@/firebase/firestore/hero_slides';
import { ImageUploader } from '@/components/ImageUploader';

const EMPTY_FORM = {
  title: '',
  description: '',
  tag: '',
  imageUrl: '',
  href: '',
  ctaLabel: 'Shop Now',
  order: 0,
  published: true,
};

export default function HeroSlidesAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<WithId<HeroSlideData> | null>(null);
  const [deletingSlide, setDeletingSlide] = useState<WithId<HeroSlideData> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const slidesQuery = useMemoFirebase(() => db ? getAllHeroSlidesQuery(db) : null, [db]);
  const { data: slides, isLoading } = useCollection<HeroSlideData>(slidesQuery);

  const publishedCount = (slides ?? []).filter(s => s.published).length;

  function openCreate() {
    setEditingSlide(null);
    const nextOrder = (slides ?? []).length;
    setForm({ ...EMPTY_FORM, order: nextOrder });
    setIsSheetOpen(true);
  }

  function openEdit(slide: WithId<HeroSlideData>) {
    setEditingSlide(slide);
    setForm({
      title: slide.title,
      description: slide.description ?? '',
      tag: slide.tag ?? '',
      imageUrl: slide.imageUrl ?? '',
      href: slide.href,
      ctaLabel: slide.ctaLabel ?? 'Shop Now',
      order: slide.order ?? 0,
      published: slide.published ?? true,
    });
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingSlide(null);
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.href.trim()) {
      toast({ variant: 'destructive', title: 'Required fields missing', description: 'Title and destination URL are required.' });
      return;
    }
    setIsSaving(true);
    try {
      if (editingSlide) {
        await updateHeroSlide(db, editingSlide.id, {
          title: form.title.trim(),
          description: form.description.trim(),
          tag: form.tag.trim(),
          imageUrl: form.imageUrl.trim(),
          href: form.href.trim(),
          ctaLabel: form.ctaLabel.trim() || 'Shop Now',
          order: Number(form.order),
          published: form.published,
        });
        toast({ title: 'Slide Updated', description: `"${form.title}" saved.` });
      } else {
        await createHeroSlide(db, {
          title: form.title.trim(),
          description: form.description.trim(),
          tag: form.tag.trim(),
          imageUrl: form.imageUrl.trim(),
          href: form.href.trim(),
          ctaLabel: form.ctaLabel.trim() || 'Shop Now',
          order: Number(form.order),
          published: form.published,
        });
        toast({ title: 'Slide Created', description: `"${form.title}" added to the carousel.` });
      }
      closeSheet();
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save to Firestore.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSlide) return;
    setIsDeleting(true);
    try {
      await deleteHeroSlide(db, deletingSlide.id);
      toast({ title: 'Slide Deleted', description: `"${deletingSlide.title}" removed.` });
      setDeletingSlide(null);
    } catch {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (slide: WithId<HeroSlideData>, direction: 'up' | 'down') => {
    const sorted = [...(slides ?? [])].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === slide.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const sibling = sorted[swapIdx];
    await Promise.all([
      reorderHeroSlide(db, slide.id, sibling.order),
      reorderHeroSlide(db, sibling.id, slide.order),
    ]);
  };

  const sorted = [...(slides ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Hero Carousel</h1>
          <p className="text-sm text-muted-foreground">Manage the rotating banner slides shown at the top of your homepage.</p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Slide
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Images className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="outline" className="border-white/20 text-white text-[10px] font-bold uppercase">Live</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Published Slides</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : publishedCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Images className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Slides</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : (slides ?? []).length}</h3>
            </div>
          </CardContent>
        </Card>
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          <div className="relative space-y-2">
            <h4 className="text-lg font-headline font-bold text-white uppercase tracking-widest leading-snug">
              Landscape<br />images work best
            </h4>
            <p className="text-xs text-white/50 leading-relaxed">Slides display at 45vh height — use wide images (1400×600px recommended).</p>
          </div>
        </div>
      </div>

      {/* Slides List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <Images className="h-12 w-12 mb-4 text-slate-200" />
          <p className="text-sm font-bold">No slides yet</p>
          <p className="text-xs mt-1">Click "Add Slide" to create your first hero banner.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((slide, idx) => (
            <div key={slide.id} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
              {/* Order controls */}
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white transition-colors"
                  onClick={() => handleReorder(slide, 'up')}
                  disabled={idx === 0}
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white transition-colors"
                  onClick={() => handleReorder(slide, 'down')}
                  disabled={idx === sorted.length - 1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              {/* Order badge */}
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{idx + 1}</span>
              </div>

              {/* Thumbnail */}
              <div className="relative h-16 w-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                {slide.imageUrl ? (
                  <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageOff className="h-5 w-5 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-headline font-bold text-base truncate">{slide.title}</h3>
                  <Badge className={cn(
                    'rounded-full text-[9px] uppercase tracking-widest border-none shrink-0',
                    slide.published ? 'bg-accent/20 text-accent-foreground' : 'bg-slate-100 text-slate-500'
                  )}>
                    {slide.published ? 'Live' : 'Draft'}
                  </Badge>
                </div>
                {slide.tag && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{slide.tag}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground font-mono truncate">{slide.href}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(slide)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-500" onClick={() => setDeletingSlide(slide)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={open => { if (!open) closeSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <div className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
              {editingSlide ? 'Editing Slide' : 'New Slide'}
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">
              {editingSlide ? editingSlide.title : 'Add Hero Slide'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingSlide ? 'Update slide details and save.' : 'Fill in the details for this carousel slide.'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Elegance Redefined"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Tag / Label
              </Label>
              <Input
                placeholder="e.g. Collection 2025"
                value={form.tag}
                onChange={e => setForm(prev => ({ ...prev, tag: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
              />
              <p className="text-[10px] text-muted-foreground">Small uppercase label shown above the title.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Description
              </Label>
              <textarea
                placeholder="Short subtitle displayed under the title..."
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[80px] rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Destination URL <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="/collections/new-arrivals"
                value={form.href}
                onChange={e => setForm(prev => ({ ...prev, href: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Where the primary CTA button links to.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                CTA Button Label
              </Label>
              <Input
                placeholder="Shop Now"
                value={form.ctaLabel}
                onChange={e => setForm(prev => ({ ...prev, ctaLabel: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Display Order
              </Label>
              <Input
                type="number"
                min={0}
                value={form.order}
                onChange={e => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 w-32"
              />
              <p className="text-[10px] text-muted-foreground">Lower numbers appear first. You can also reorder using the up/down arrows on the list.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Banner Image
              </Label>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
                folder="pehnava/hero"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-sm font-bold uppercase tracking-tight">Published</p>
                <p className="text-[10px] text-muted-foreground">Visible in the homepage carousel</p>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={v => setForm(prev => ({ ...prev, published: v }))}
              />
            </div>
          </div>

          <SheetFooter className="pt-6 border-t gap-3 flex-col sm:flex-row">
            <Button variant="outline" onClick={closeSheet} className="flex-1 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingSlide ? 'Save Changes' : 'Add Slide'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSlide} onOpenChange={open => { if (!open) setDeletingSlide(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl uppercase">Delete Slide?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently delete <span className="font-bold text-foreground">"{deletingSlide?.title}"</span> from the carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold uppercase text-[10px] tracking-widest h-12">Cancel</AlertDialogCancel>
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
