'use client';

import { useState } from 'react';
import { Mail, Calendar, Sparkles, Package, HelpCircle, MailOpen, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  getAllContactMessagesQuery,
  markMessageRead,
  markMessageReplied,
  type ContactMessageData,
} from '@/firebase/firestore/contact_messages';
import { deleteDoc, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { WithId } from '@/firebase/firestore/use-collection';

const INQUIRY_ICONS: Record<string, React.ElementType> = {
  'studio-visit': Calendar,
  'custom-order': Sparkles,
  'order-support': Package,
  'general': HelpCircle,
};

const INQUIRY_LABELS: Record<string, string> = {
  'studio-visit': 'Studio Visit',
  'custom-order': 'Custom Order',
  'order-support': 'Order Support',
  'general': 'General',
};

const STATUS_CONFIG = {
  unread:  { label: 'Unread',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  read:    { label: 'Read',    color: 'bg-slate-100 text-slate-600 border-slate-200' },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-700 border-green-200' },
};

export default function AdminMessagesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [selected, setSelected] = useState<WithId<ContactMessageData> | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const query = useMemoFirebase(() => db ? getAllContactMessagesQuery(db) : null, [db]);
  const { data: messages, isLoading } = useCollection<ContactMessageData>(query);

  const unreadCount = (messages ?? []).filter(m => m.status === 'unread').length;

  const handleSelect = async (msg: WithId<ContactMessageData>) => {
    setSelected(msg);
    if (msg.status === 'unread' && db) {
      await markMessageRead(db, msg.id).catch(() => {});
    }
  };

  const handleMarkReplied = async (id: string) => {
    if (!db) return;
    setActionLoading(id + '-replied');
    try {
      await markMessageReplied(db, id);
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'replied' } : null);
      toast({ title: 'Marked as replied' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm('Delete this message?')) return;
    setActionLoading(id + '-delete');
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
      if (selected?.id === id) setSelected(null);
      toast({ title: 'Message deleted' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Contact Messages</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All messages read'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
        </div>
      ) : (messages ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center border-2 border-dashed rounded-3xl">
          <Mail className="h-12 w-12 text-slate-200" />
          <h3 className="font-headline font-bold text-slate-400 text-lg">No messages yet</h3>
          <p className="text-sm text-muted-foreground">Customer messages from the Contact page will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Message list */}
          <div className="lg:col-span-5 space-y-2">
            {(messages ?? []).map(msg => {
              const Icon = INQUIRY_ICONS[msg.inquiryType] ?? HelpCircle;
              const isActive = selected?.id === msg.id;
              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border-2 transition-all space-y-2",
                    isActive ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-white hover:border-primary/20 hover:bg-slate-50",
                    msg.status === 'unread' && !isActive && "border-blue-100 bg-blue-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", isActive ? "bg-primary text-white" : "bg-secondary")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-bold truncate", msg.status === 'unread' ? "text-foreground" : "text-muted-foreground")}>{msg.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{msg.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn("text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", STATUS_CONFIG[msg.status].color)}>
                        {STATUS_CONFIG[msg.status].label}
                      </span>
                      {msg.status === 'unread' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 pl-10">{msg.subject || msg.message}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider pl-10">
                    {INQUIRY_LABELS[msg.inquiryType] ?? msg.inquiryType} · {msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Just now'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Message detail */}
          <div className="lg:col-span-7">
            {selected ? (
              <div className="bg-white rounded-3xl border p-6 md:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-headline font-bold">{selected.subject || INQUIRY_LABELS[selected.inquiryType]}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>{INQUIRY_LABELS[selected.inquiryType] ?? selected.inquiryType}</span>
                      <span>·</span>
                      <span className={cn("px-2 py-0.5 rounded-full border", STATUS_CONFIG[selected.status].color)}>
                        {STATUS_CONFIG[selected.status].label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selected.status !== 'replied' && (
                      <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-[10px] font-bold uppercase"
                        disabled={actionLoading === selected.id + '-replied'}
                        onClick={() => handleMarkReplied(selected.id)}>
                        {actionLoading === selected.id + '-replied' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                        Replied
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10 gap-1.5 text-[10px] font-bold uppercase"
                      disabled={actionLoading === selected.id + '-delete'}
                      onClick={() => handleDelete(selected.id)}>
                      {actionLoading === selected.id + '-delete' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl text-sm">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">From</p>
                    <p className="font-bold mt-0.5">{selected.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
                    <a href={`mailto:${selected.email}`} className="font-bold text-primary hover:underline mt-0.5 block truncate">{selected.email}</a>
                  </div>
                  {selected.phone && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">WhatsApp</p>
                      <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-bold text-green-600 hover:underline mt-0.5 block">{selected.phone}</a>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Received</p>
                    <p className="font-bold mt-0.5">{selected.createdAt ? new Date(selected.createdAt.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Message</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-2xl p-4">{selected.message}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button asChild className="rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest">
                    <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || '')}`}>
                      <Mail className="h-4 w-4" /> Reply via Email
                    </a>
                  </Button>
                  {selected.phone && (
                    <Button asChild variant="outline" className="rounded-xl gap-2 font-bold text-[10px] uppercase tracking-widest border-green-200 text-green-700 hover:bg-green-50">
                      <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <MailOpen className="h-4 w-4" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-3xl text-center space-y-3">
                <Mail className="h-10 w-10 text-slate-200" />
                <p className="text-sm text-muted-foreground font-medium">Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
