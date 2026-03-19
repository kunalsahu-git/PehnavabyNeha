'use client';

import React, { useState } from 'react';
import { 
  Search, Plus, Tag, Calendar, MoreVertical, Edit, Trash2, 
  ToggleLeft, ToggleRight, Loader2, Info, Percent, IndianRupee,
  Layers, Package, Filter, CheckCircle2, XCircle, AlertCircle,
  Sparkles
} from 'lucide-react';
import { useDataTable } from '@/hooks/useDataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, type WithId } from '@/firebase';
import { 
  getCouponsQuery, createCoupon, updateCoupon, deleteCoupon, type CouponData 
} from '@/firebase/firestore/coupons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function CouponsAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<WithId<CouponData> | null>(null);
  
  // Coupon Form State - Use strings for inputs to handle "blank" state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    rewardType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    rewardValue: '' as string | number,
    minOrderValue: '' as string | number,
    minQuantity: '' as string | number,
    totalLimit: '' as string | number,
    isActive: true,
    excludeSaleItems: false,
    endDate: '',
  });

  const couponsQuery = useMemoFirebase(() => db ? getCouponsQuery(db) : null, [db]);
  const { data: coupons, isLoading } = useCollection<CouponData>(couponsQuery);

  const tableData = React.useMemo(() => {
    return (coupons ?? []).map(c => ({
      ...c,
      createdAtMillis: c.createdAt?.toMillis?.() || (c.createdAt instanceof Date ? c.createdAt.getTime() : 0)
    }));
  }, [coupons]);

  const {
    searchTerm, setSearchTerm,
    filteredData,
    toggleSort, sortConfig
  } = useDataTable<WithId<CouponData & { createdAtMillis: number }>>({
    data: tableData,
    searchFields: ['code', 'description'],
    initialSort: { key: 'createdAtMillis', direction: 'desc' }
  });

  const handleOpenModal = (coupon?: WithId<CouponData>) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description,
        rewardType: coupon.rewardType,
        rewardValue: coupon.rewardValue,
        minOrderValue: coupon.minOrderValue || '',
        minQuantity: coupon.minQuantity || '',
        totalLimit: coupon.totalLimit || '',
        isActive: coupon.isActive,
        excludeSaleItems: coupon.excludeSaleItems || false,
        endDate: coupon.endDate ? format(coupon.endDate.toDate(), 'yyyy-MM-dd') : '',
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        rewardType: 'PERCENTAGE',
        rewardValue: '',
        minOrderValue: '',
        minQuantity: '',
        totalLimit: '',
        isActive: true,
        excludeSaleItems: false,
        endDate: '',
      });
    }
    setIsModalOpen(true);
  };

  const suggestCouponName = () => {
    const prefixes = ['HOT', 'CHIC', 'GLAM', 'LUXE', 'STYLE', 'TREND'];
    const suffixes = ['VIBE', 'PICK', 'SAVE', 'LOVE', 'GLOW', 'BAE'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 90) + 10;
    
    // AI Trending Picks simulating Instagram/Twitter vibes
    const trending = [
      `PEHNAVA_${randomPrefix}${number}`,
      `${randomPrefix}_${randomSuffix}_500`,
      `INSTA_CHIC_${number}`,
      `TRENDING_NOW_${number}`,
      `HOT_LIST_S26`,
      `NEHA_PICKS_100`
    ];
    
    const picked = trending[Math.floor(Math.random() * trending.length)];
    setFormData(prev => ({ ...prev, code: picked.toUpperCase() }));
    toast({ 
      title: 'AI Suggested Code', 
      description: `"${picked}" is currently trending in your category!`,
      // icon: <Sparkles className="h-4 w-4" /> 
    });
  };

  const handleSubmit = async () => {
    if (!db) return;
    if (!formData.code || !formData.rewardValue) {
      toast({ variant: 'destructive', title: 'Invalid Data', description: 'Code and reward value are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanData: any = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        rewardValue: Number(formData.rewardValue),
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
        minQuantity: formData.minQuantity ? Number(formData.minQuantity) : null,
        totalLimit: formData.totalLimit ? Number(formData.totalLimit) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      };

      if (editingCoupon) {
        await updateCoupon(db, editingCoupon.id, cleanData);
        toast({ title: 'Coupon Updated', description: `${cleanData.code} has been modified.` });
      } else {
        await createCoupon(db, cleanData);
        toast({ title: 'Coupon Created', description: `${cleanData.code} is now ready to use.` });
      }
      setIsModalOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Check console for details.' });
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: WithId<CouponData>) => {
    if (!db) return;
    try {
      await updateCoupon(db, coupon.id, { isActive: !coupon.isActive });
      toast({ title: coupon.isActive ? 'Coupon Disabled' : 'Coupon Enabled' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Toggle Failed' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !window.confirm('Delete this coupon?')) return;
    try {
      await deleteCoupon(db, id);
      toast({ title: 'Coupon Deleted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-wider text-primary">Promotions & Coupons</h1>
          <p className="text-sm text-muted-foreground">Create discount codes and manage marketing campaigns.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="rounded-full font-bold uppercase text-[10px] tracking-widest h-12 px-8 shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4 mr-2" /> Create New Coupon
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-12 h-12 border-none bg-white shadow-sm focus-visible:ring-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest"
          />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-50">
                  <TableHead className="py-6 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">Coupon Code</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reward</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Usage</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expiry</TableHead>
                  <TableHead className="px-8 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? filteredData.map(coupon => (
                  <TableRow key={coupon.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                    <TableCell className="py-5 px-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors font-mono tracking-wider">{coupon.code}</span>
                        <span className="text-[10px] text-muted-foreground font-medium mt-1 truncate max-w-[200px]">{coupon.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-tighter border-none whitespace-nowrap",
                        coupon.rewardType === 'PERCENTAGE' ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                      )}>
                        {coupon.rewardType === 'PERCENTAGE' ? <Percent className="h-2 w-2 mr-1 inline" /> : <IndianRupee className="h-2 w-2 mr-1 inline" />}
                        {coupon.rewardValue}{coupon.rewardType === 'PERCENTAGE' ? '%' : ''} OFF
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", coupon.isActive ? "bg-green-500" : "bg-slate-300")} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-600">{coupon.isActive ? 'Active' : 'Paused'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-700">{coupon.usageCount} {coupon.totalLimit ? `/ ${coupon.totalLimit}` : 'Redeemed'}</span>
                        <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full rounded-full" 
                            style={{ width: `${coupon.totalLimit ? (coupon.usageCount / coupon.totalLimit) * 100 : 100}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {coupon.endDate ? format(coupon.endDate.toDate(), 'MMM dd, yyyy') : 'No Expiry'}
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleToggleActive(coupon)}
                          className={cn("h-9 w-9 rounded-full", coupon.isActive ? "text-amber-500 hover:bg-amber-50" : "text-green-500 hover:bg-green-50")}
                        >
                          {coupon.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-slate-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer" onClick={() => handleOpenModal(coupon)}>
                              <Edit className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase font-headline">Edit Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50" onClick={() => handleDelete(coupon.id)}>
                              <Trash2 className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase font-headline">Delete Permanent</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground text-sm">
                      No coupons found. Create your first campaign!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="font-headline uppercase tracking-wider text-2xl">{editingCoupon ? 'Edit Coupon' : 'Create New Promotion'}</DialogTitle>
            <DialogDescription className="text-xs">Configure your discount rules and usage conditions.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unique Code</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={suggestCouponName}
                    className="h-5 px-2 text-[9px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-full"
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> AI Suggest
                  </Button>
                </div>
                <Input 
                  placeholder="e.g. WELCOME10" 
                  value={formData.code} 
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="h-12 rounded-xl font-black font-mono uppercase text-lg border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Internal Description</Label>
                <Input 
                  placeholder="e.g. 10% off for first order" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="h-12 rounded-xl"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Reward Type</Label>
                  <Select 
                    value={formData.rewardType} 
                    onValueChange={(v: any) => setFormData({ ...formData, rewardType: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED">Flat Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Value</Label>
                  <Input 
                    type="number" 
                    placeholder="Enter value"
                    value={formData.rewardValue} 
                    onChange={e => setFormData({ ...formData, rewardValue: e.target.value })}
                    className="h-12 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <Filter className="h-3 w-3" /> Usage Constraints
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Min Order (₹)</Label>
                    <Input 
                      type="number" 
                      placeholder="No Min"
                      value={formData.minOrderValue} 
                      onChange={e => setFormData({ ...formData, minOrderValue: e.target.value })}
                      className="h-9 rounded-lg bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Min Qty</Label>
                    <Input 
                      type="number" 
                      placeholder="No Min"
                      value={formData.minQuantity} 
                      onChange={e => setFormData({ ...formData, minQuantity: e.target.value })}
                      className="h-9 rounded-lg bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Global Limit</Label>
                    <Input 
                      type="number" 
                      placeholder="Unlimited"
                      value={formData.totalLimit} 
                      onChange={e => setFormData({ ...formData, totalLimit: e.target.value })}
                      className="h-9 rounded-lg bg-white border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Expiry Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 pl-3 text-left font-normal border-slate-200 rounded-lg",
                            !formData.endDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {formData.endDate ? format(new Date(formData.endDate), 'MMM dd, yyyy') : "No Expiry"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-3xl border-slate-200 shadow-2xl shadow-primary/10 overflow-hidden" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.endDate ? new Date(formData.endDate) : undefined}
                          onSelect={(date) => setFormData({ ...formData, endDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const nextYear = new Date();
                            nextYear.setFullYear(nextYear.getFullYear() + 1);
                            return date < today || date > nextYear;
                          }}
                          initialFocus
                          className="rounded-2xl border-none shadow-none"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-tight">Active Campaign</Label>
                    <p className="text-[9px] text-muted-foreground">Allow instant redemption.</p>
                  </div>
                  <Switch checked={formData.isActive} onCheckedChange={v => setFormData({ ...formData, isActive: v })} />
                </div>
                <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="text-[10px] font-bold uppercase tracking-tight">Exclude Sale Items</Label>
                    <p className="text-[9px] text-muted-foreground">No double-discounting.</p>
                  </div>
                  <Switch checked={formData.excludeSaleItems} onCheckedChange={v => setFormData({ ...formData, excludeSaleItems: v })} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6 gap-2">
            <Button variant="outline" className="rounded-xl h-12 px-8 uppercase text-[10px] font-bold tracking-widest" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button 
              disabled={isSubmitting} 
              onClick={handleSubmit}
              className="rounded-xl h-12 px-10 bg-primary text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingCoupon ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingCoupon ? 'Apply Changes' : 'Launch Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
