'use client';

import React, { useState } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, Menu, ChevronUp, ChevronDown,
  ExternalLink, ChevronRight, X, Sparkles,
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
  getAllNavItemsQuery, createNavItem, updateNavItem, deleteNavItem,
  reorderNavItem, type NavItemData, type NavChild,
} from '@/firebase/firestore/nav_items';

const EMPTY_FORM = {
  label: '',
  href: '',
  order: 0,
  published: true,
  highlight: false,
  openInNewTab: false,
  children: [] as NavChild[],
};

const EMPTY_CHILD: NavChild = { label: '', href: '', description: '', order: 0 };

export default function NavigationAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  const [isSeeding, setIsSeeding] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WithId<NavItemData> | null>(null);
  const [deletingItem, setDeletingItem] = useState<WithId<NavItemData> | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const navQuery = useMemoFirebase(() => db ? getAllNavItemsQuery(db) : null, [db]);
  const { data: navItems, isLoading } = useCollection<NavItemData>(navQuery);

  // ── Default nav seed ────────────────────────────────────────────────────────
  const DEFAULT_NAV: Omit<NavItemData, 'createdAt' | 'updatedAt'>[] = [
    { label: 'Our Story', href: '/about', order: 0, published: true },
    {
      label: 'Collections', order: 1, published: true,
      children: [
        { label: 'Sarees', href: '/collections/sarees', order: 0, description: 'Six yards of timeless elegance' },
        { label: 'Lehengas', href: '/collections/lehengas', order: 1, description: 'Statement silhouettes for grand occasions' },
        { label: 'Anarkalis', href: '/collections/anarkalis', order: 2, description: 'Flowing Mughal-inspired silhouettes' },
        { label: 'Ethnic Sets', href: '/collections/ethnic-sets', order: 3, description: 'Coordinated sets for every occasion' },
        { label: 'Salwar Kameez', href: '/collections/salwar-kameez', order: 4, description: 'Comfort meets tradition' },
        { label: 'Kurtas & Tops', href: '/collections/kurtas-tops', order: 5, description: 'Everyday ethnic chic' },
      ],
    },
    {
      label: 'Occasions', order: 2, published: true,
      children: [
        { label: 'Bridal Wear', href: '/collections/bridal-wear', order: 0, description: 'Crafted for your forever moment' },
        { label: 'Indo-Western', href: '/collections/indo-western', order: 1, description: 'East meets West, elevated' },
        { label: 'Accessories', href: '/collections/accessories', order: 2, description: 'The finishing touch' },
        { label: 'Dupattas', href: '/collections/dupattas', order: 3, description: 'Weightless drapes of colour' },
      ],
    },
    { label: 'New Arrivals', href: '/collections/new-arrivals', order: 3, published: true },
    { label: 'Sale', href: '/collections/sale', order: 4, published: true, highlight: true },
  ];

  const handleSeedDefaultNav = async () => {
    if ((navItems ?? []).length > 0) {
      toast({ variant: 'destructive', title: 'Navigation already has items', description: 'Clear existing items before seeding defaults.' });
      return;
    }
    setIsSeeding(true);
    try {
      for (const item of DEFAULT_NAV) {
        await createNavItem(db, item);
      }
      toast({ title: 'Default navigation seeded!', description: `${DEFAULT_NAV.length} items added. You can now edit them.` });
    } catch {
      toast({ variant: 'destructive', title: 'Seed failed', description: 'Could not write to Firestore.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const sorted = [...(navItems ?? [])].sort((a, b) => a.order - b.order);
  const publishedCount = (navItems ?? []).filter(n => n.published).length;

  function openCreate() {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, order: (navItems ?? []).length });
    setIsSheetOpen(true);
  }

  function openEdit(item: WithId<NavItemData>) {
    setEditingItem(item);
    setForm({
      label: item.label,
      href: item.href ?? '',
      order: item.order ?? 0,
      published: item.published ?? true,
      highlight: item.highlight ?? false,
      openInNewTab: item.openInNewTab ?? false,
      children: item.children ? [...item.children].sort((a, b) => a.order - b.order) : [],
    });
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setIsSheetOpen(false);
    setEditingItem(null);
  }

  // ── Child management ────────────────────────────────────────────────────────
  const addChild = () => {
    setForm(prev => ({
      ...prev,
      children: [...prev.children, { ...EMPTY_CHILD, order: prev.children.length }],
    }));
  };

  const updateChild = (idx: number, field: keyof NavChild, value: string | number) => {
    setForm(prev => ({
      ...prev,
      children: prev.children.map((c, i) => i === idx ? { ...c, [field]: value } : c),
    }));
  };

  const removeChild = (idx: number) => {
    setForm(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== idx).map((c, i) => ({ ...c, order: i })),
    }));
  };

  const moveChild = (idx: number, direction: 'up' | 'down') => {
    const children = [...form.children];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= children.length) return;
    [children[idx], children[swapIdx]] = [children[swapIdx], children[idx]];
    setForm(prev => ({ ...prev, children: children.map((c, i) => ({ ...c, order: i })) }));
  };

  // ── Save / Delete ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.label.trim()) {
      toast({ variant: 'destructive', title: 'Label required' });
      return;
    }
    // Validate children
    for (const child of form.children) {
      if (!child.label.trim() || !child.href.trim()) {
        toast({ variant: 'destructive', title: 'Incomplete dropdown item', description: 'Each dropdown item needs a label and URL.' });
        return;
      }
    }
    setIsSaving(true);
    try {
      const payload: Omit<NavItemData, 'createdAt' | 'updatedAt'> = {
        label: form.label.trim(),
        order: Number(form.order),
        published: form.published,
        highlight: form.highlight,
        openInNewTab: form.openInNewTab,
        children: form.children.map((c, i) => ({
          label: c.label.trim(),
          href: c.href.trim(),
          order: i,
          ...(c.description?.trim() && { description: c.description.trim() }),
        })),
        ...(form.href.trim() && { href: form.href.trim() }),
      };
      if (editingItem) {
        await updateNavItem(db, editingItem.id, payload);
        toast({ title: 'Nav Item Updated', description: `"${form.label}" saved.` });
      } else {
        await createNavItem(db, payload);
        toast({ title: 'Nav Item Created', description: `"${form.label}" added to the menu.` });
      }
      closeSheet();
    } catch {
      toast({ variant: 'destructive', title: 'Save Failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await deleteNavItem(db, deletingItem.id);
      toast({ title: 'Item Deleted', description: `"${deletingItem.label}" removed from navigation.` });
      setDeletingItem(null);
    } catch {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReorder = async (item: WithId<NavItemData>, direction: 'up' | 'down') => {
    const idx = sorted.findIndex(n => n.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const sibling = sorted[swapIdx];
    await Promise.all([
      reorderNavItem(db, item.id, sibling.order),
      reorderNavItem(db, sibling.id, item.order),
    ]);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Navigation</h1>
          <p className="text-sm text-muted-foreground">
            Manage the storefront menu. Add parent items with optional dropdown children.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Menu Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Menu className="h-6 w-6 text-accent" />
              </div>
              <Badge variant="outline" className="border-white/20 text-white text-[10px] font-bold uppercase">Live</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Published Items</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : publishedCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <Menu className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Items</p>
              <h3 className="text-4xl font-headline font-bold">{isLoading ? '—' : (navItems ?? []).length}</h3>
            </div>
          </CardContent>
        </Card>
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          <div className="relative space-y-2">
            <h4 className="text-lg font-headline font-bold text-white uppercase tracking-widest leading-snug">
              Tip: Use<br />dropdown children
            </h4>
            <p className="text-xs text-white/50 leading-relaxed">Add child items to any parent to create a hover dropdown in the desktop nav.</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-6">
          <Menu className="h-12 w-12 text-slate-200" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">No menu items yet</p>
            <p className="text-xs">Start from scratch or load the default navigation structure.</p>
          </div>
          <Button
            onClick={handleSeedDefaultNav}
            disabled={isSeeding}
            variant="outline"
            className="rounded-full h-12 px-8 font-bold uppercase text-[10px] tracking-widest border-primary/20 hover:bg-primary/5 hover:border-primary/40"
          >
            {isSeeding
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Seeding…</>
              : <><Sparkles className="h-4 w-4 mr-2" /> Load Default Navigation</>
            }
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, idx) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all">
              <div className="flex items-center gap-4 p-4">
                {/* Order controls */}
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white" onClick={() => handleReorder(item, 'up')} disabled={idx === 0}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary hover:text-white" onClick={() => handleReorder(item, 'down')} disabled={idx === sorted.length - 1}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{idx + 1}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-headline font-bold text-base",
                      item.highlight && "text-primary"
                    )}>
                      {item.label}
                    </span>
                    <Badge className={cn(
                      'rounded-full text-[9px] uppercase tracking-widest border-none',
                      item.published ? 'bg-accent/20 text-accent-foreground' : 'bg-slate-100 text-slate-500'
                    )}>
                      {item.published ? 'Live' : 'Draft'}
                    </Badge>
                    {item.highlight && (
                      <Badge className="rounded-full text-[9px] uppercase tracking-widest border-none bg-primary/10 text-primary">Highlighted</Badge>
                    )}
                    {(item.children?.length ?? 0) > 0 && (
                      <Badge className="rounded-full text-[9px] uppercase tracking-widest border-none bg-violet-50 text-violet-600">
                        {item.children!.length} dropdown items
                      </Badge>
                    )}
                  </div>
                  {item.href && (
                    <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{item.href}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.href && (
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-500" onClick={() => setDeletingItem(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Children preview */}
              {(item.children?.length ?? 0) > 0 && (
                <div className="border-t border-slate-50 px-4 py-3 bg-slate-50/50">
                  <div className="flex flex-wrap gap-2">
                    {[...item.children!].sort((a, b) => a.order - b.order).map((child, ci) => (
                      <div key={ci} className="flex items-center gap-1.5 text-[10px] bg-white border border-slate-100 rounded-full px-3 py-1.5 font-medium text-slate-600">
                        <ChevronRight className="h-2.5 w-2.5 text-primary" />
                        {child.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={open => { if (!open) closeSheet(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <div className="text-[10px] font-bold text-accent uppercase tracking-[0.3em]">
              {editingItem ? 'Editing Item' : 'New Menu Item'}
            </div>
            <SheetTitle className="text-3xl font-headline font-bold uppercase">
              {editingItem ? editingItem.label : 'Add Item'}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Add child items to create a dropdown. Leave URL empty for parent-only nodes.
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {/* Label */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Label <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Collections"
                value={form.label}
                onChange={e => setForm(prev => ({ ...prev, label: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                URL <span className="text-muted-foreground font-normal normal-case">(leave empty if dropdown-only)</span>
              </Label>
              <Input
                placeholder="/collections/sarees"
                value={form.href}
                onChange={e => setForm(prev => ({ ...prev, href: e.target.value }))}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-mono text-sm"
              />
            </div>

            {/* Order */}
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

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold uppercase tracking-tight">Published</p>
                  <p className="text-[10px] text-muted-foreground">Visible on the storefront</p>
                </div>
                <Switch checked={form.published} onCheckedChange={v => setForm(prev => ({ ...prev, published: v }))} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold uppercase tracking-tight">Highlighted</p>
                  <p className="text-[10px] text-muted-foreground">Shows label in primary color (e.g. for "Sale")</p>
                </div>
                <Switch checked={form.highlight} onCheckedChange={v => setForm(prev => ({ ...prev, highlight: v }))} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold uppercase tracking-tight">Open in New Tab</p>
                  <p className="text-[10px] text-muted-foreground">Link opens in a new browser tab</p>
                </div>
                <Switch checked={form.openInNewTab} onCheckedChange={v => setForm(prev => ({ ...prev, openInNewTab: v }))} />
              </div>
            </div>

            <Separator />

            {/* Dropdown Children */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-tight">Dropdown Items</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Child links shown in a hover dropdown panel</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addChild}
                  className="rounded-xl h-9 font-bold uppercase text-[9px] tracking-widest border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>

              {form.children.length === 0 ? (
                <div className="text-center py-6 rounded-2xl border-2 border-dashed border-slate-100 text-muted-foreground">
                  <p className="text-xs">No dropdown items. Click "Add" to create child links.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.children.map((child, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item {idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => moveChild(idx, 'up')} disabled={idx === 0}>
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => moveChild(idx, 'down')} disabled={idx === form.children.length - 1}>
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-red-50 hover:text-red-500" onClick={() => removeChild(idx)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Label *</Label>
                          <Input
                            placeholder="Sarees"
                            value={child.label}
                            onChange={e => updateChild(idx, 'label', e.target.value)}
                            className="h-9 rounded-lg border-slate-100 bg-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">URL *</Label>
                          <Input
                            placeholder="/collections/sarees"
                            value={child.href}
                            onChange={e => updateChild(idx, 'href', e.target.value)}
                            className="h-9 rounded-lg border-slate-100 bg-white text-sm font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Description (optional)</Label>
                        <Input
                          placeholder="Short subtitle shown under the label in the dropdown"
                          value={child.description ?? ''}
                          onChange={e => updateChild(idx, 'description', e.target.value)}
                          className="h-9 rounded-lg border-slate-100 bg-white text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="pt-6 border-t gap-3 flex-col sm:flex-row">
            <Button variant="outline" onClick={closeSheet} className="flex-1 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-xl h-12 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={open => { if (!open) setDeletingItem(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-2xl uppercase">Delete Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently remove <span className="font-bold text-foreground">"{deletingItem?.label}"</span> and all its dropdown children from the navigation.
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
