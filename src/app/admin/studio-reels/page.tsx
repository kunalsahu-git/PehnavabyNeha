'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Plus, Edit2, Trash2, Loader2, ImageOff, Film,
  ChevronUp, ChevronDown, Play,
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
  getAllStudioReelsQuery, createStudioReel, updateStudioReel, deleteStudioReel,
  reorderStudioReel, type StudioReelData,
} from '@/firebase/firestore/studio_reels';
import { ImageUploader } from '@/components/ImageUploader';

const EMPTY_FORM = {
  title: '',
  tag: '',
  imageUrl: '',
  videoUrl: '',
  instagramUrl: '',
  order: 0,
  published: true,
};

export default function StudioReelsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingReel, setEditingReel] = useState<WithId<StudioReelData> | null>(null);
  const [deletingReel, setDeletingReel] = useState<WithId<StudioReelData> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const reelsQuery = useMemoFirebase(() => db ? getAllStudioReelsQuery(db) : null, [db]);
  const { data: reels, isLoading } = useCollection<StudioReelData>(reelsQuery);

  const publishedCount = (reels ?? []).filter(r => r.published).length;

  function openCreate() {
    setEditingReel(null);
    setForm({ ...EMPTY_FORM, order: (reels ?? []).length });
    setIsSheetOpen(true);
  }

  function openEdit(reel: WithId<StudioReelData>) {
    setEditingReel(reel);
    setForm({
      title: reel.title,
      tag: reel.tag ?? '',
      imageUrl: reel.imageUrl ?? '',
      videoUrl: reel.videoUrl ?? '',
      instagramUrl: reel.instagramUrl ?? '',
      order: reel.order ?? 0,
      published: reel.published ?? true,
    });
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingReel(null);
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ variant: 'destructive', title: 'Title required' });
      return;
    }
    setIsSaving(true);
    try {
      const payload: Omit<StudioReelData, 'createdAt' | 'updatedAt'> = {
        title: form.title.trim(),
        tag: form.tag.trim(),
        imageUrl: form.imageUrl.trim(),
        order: Number(form.order),
        published: form.published,
        ...(form.videoUrl.trim() && { videoUrl: form.videoUrl.trim() }),
        ...(form.instagramUrl.trim() && { instagramUrl: form.instagramUrl.trim() }),
      };
      if (editingReel) {
        await updateStudioReel(db, editingReel.id, payload);
        toast({ title: 'Reel Updated', description: `"${form.title}" saved.` });
      } else {
        await createStudioReel(db, payload);
        toast({ title: 'Reel Added', description: `"${form.title}" added to Studio Stories.` });
      }
      closeSheet();
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save to Firestore.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingReel) return;
    setIsDeleting(true);
    try {
      await deleteStudioReel(db, deletingReel.id);
      toast({ title: 'Reel Deleted', description: `"${deletingReel.title}" removed.` });
      setDeletingReel(null);
    } catch {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (reel: WithId<StudioReelData>, direction: 'up' | 'down') => {
    const sorted = [...(reels ?? [])].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(r => r.id === reel.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const sibling = sorted[swapIdx];
    await Promise.all([
      reorderStudioReel(db, reel.id, sibling.order),
      reorderStudioReel(db, sibling.id, reel.order),
    ]);
  };

  const sorted = [...(reels ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Studio Stories</h1>
          <p className="text-sm text-muted-foreground">Manage the reel-style story cards shown on your homepage.</p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Reel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Film className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="outline" className="border-white/20 text-white text-[10px] font-bold uppercase">Live</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Published Reels</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : publishedCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Film className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Reels</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : (reels ?? []).length}</h3>
            </div>
          </CardContent>
        </Card>
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          <div className="relative space-y-2">
            <h4 className="text-lg font-headline font-bold text-white uppercase tracking-widest leading-snug">
              Portrait images<br />look best
            </h4>
            <p className="text-xs text-white/50 leading-relaxed">Reels display in a 9:16 portrait card — use vertical images (400×700px recommended).</p>
          </div>
        </div>
      </div>

      {/* Reels List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <Film className="h-12 w-12 mb-4 text-slate-200" />
          <p className="text-sm font-bold">No reels yet</p>
          <p className="text-xs mt-1">Click "Add Reel" to populate your Studio Stories section.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((reel, idx) => (
            <div key={reel.id} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
              {/* Order controls */}
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white" onClick={() => handleReorder(reel, 'up')} disabled={idx === 0}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white" onClick={() => handleReorder(reel, 'down')} disabled={idx === sorted.length - 1}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">{idx + 1}</span>
              </div>

              {/* Portrait thumbnail */}
              <div className="relative h-16 w-9 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                {reel.imageUrl ? (
                  <Image src={reel.imageUrl} alt={reel.title} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageOff className="h-4 w-4 text-slate-300" />
                  </div>
                )}
                {(reel.videoUrl || reel.instagramUrl) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-3 w-3 text-white fill-current" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-headline font-bold text-base truncate">{reel.title}</h3>
                  <Badge className={cn(
                    'rounded-full text-[9px] uppercase tracking-widest border-none shrink-0',
                    reel.published ? 'bg-accent/20 text-accent-foreground' : 'bg-slate-100 text-slate-500'
                  )}>
                    {reel.published ? 'Live' : 'Draft'}
                  </Badge>
                </div>
                {reel.tag && <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{reel.tag}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(reel)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-500" onClick={() => setDeletingReel(reel)}>
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
              {editingReel ? 'Editing Reel' : 'New Reel'}
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">
              {editingReel ? editingReel.title : 'Add Studio Reel'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editingReel ? 'Update reel details and save.' : 'Fill in the details for this story card.'}
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Boutique BTS"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Hashtag / Tag
              </Label>
              <Input
                placeholder="#StudioVibes"
                value={form.tag}
                onChange={e => setForm(prev => ({ ...prev, tag: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Cover Image
              </Label>
              <ImageUploader
                value={form.imageUrl}
                onChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
                folder="pehnava/reels"
              />
              <p className="text-[10px] text-muted-foreground">Use vertical portrait images (9:16 ratio) for best results.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Video URL <span className="text-muted-foreground font-normal normal-case">(optional)</span>
              </Label>
              <Input
                placeholder="https://..."
                value={form.videoUrl}
                onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Instagram Reel URL <span className="text-muted-foreground font-normal normal-case">(optional)</span>
              </Label>
              <Input
                placeholder="https://www.instagram.com/reel/..."
                value={form.instagramUrl}
                onChange={e => setForm(prev => ({ ...prev, instagramUrl: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">When set, clicking the play button opens the reel on Instagram.</p>
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
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-sm font-bold uppercase tracking-tight">Published</p>
                <p className="text-[10px] text-muted-foreground">Visible in the Studio Stories section</p>
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
              {editingReel ? 'Save Changes' : 'Add Reel'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingReel} onOpenChange={open => { if (!open) setDeletingReel(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl uppercase">Delete Reel?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently remove <span className="font-bold text-foreground">"{deletingReel?.title}"</span> from Studio Stories.
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
