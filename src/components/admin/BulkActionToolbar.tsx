import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BulkAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
}

export function BulkActionToolbar({ selectedCount, onClear, actions }: BulkActionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4 border border-white/10 backdrop-blur-xl bg-opacity-90">
            <div className="flex items-center gap-4 border-r border-white/10 pr-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClear}
                className="h-8 w-8 rounded-full hover:bg-white/10 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex flex-col">
                <span className="text-sm font-bold">{selectedCount} Selected</span>
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-black">Bulk Actions</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {actions.map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  onClick={action.onClick}
                  className={cn(
                    "rounded-xl h-10 px-4 font-bold uppercase text-[9px] tracking-widest gap-2 shrink-0 transition-all active:scale-95",
                    !action.variant || action.variant === 'secondary' ? "bg-white/10 text-white hover:bg-white/20 border-none" : ""
                  )}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
