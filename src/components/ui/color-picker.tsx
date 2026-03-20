'use client';

import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FASHION_COLORS, colorToCSS, isLightColor, type ProductColor } from '@/lib/colors';

interface ColorPickerProps {
  value: ProductColor[];
  onChange: (colors: ProductColor[]) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [customName, setCustomName] = useState('');
  const [customHex, setCustomHex] = useState('#000000');
  const [showCustom, setShowCustom] = useState(false);

  const isSelected = (color: ProductColor) =>
    value.some(v => v.name.toLowerCase() === color.name.toLowerCase());

  const toggle = (color: ProductColor) => {
    if (isSelected(color)) {
      onChange(value.filter(v => v.name.toLowerCase() !== color.name.toLowerCase()));
    } else {
      onChange([...value, color]);
    }
  };

  const remove = (name: string) =>
    onChange(value.filter(v => v.name.toLowerCase() !== name.toLowerCase()));

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    // Don't duplicate
    if (value.some(v => v.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...value, { name, hex: customHex }]);
    setCustomName('');
    setCustomHex('#000000');
    setShowCustom(false);
  };

  return (
    <div className="space-y-4">
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[52px]">
          {value.map(color => (
            <span
              key={color.name}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 shadow-sm"
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full border flex-shrink-0',
                  isLightColor(color.hex) ? 'border-slate-300' : 'border-transparent'
                )}
                style={{ background: colorToCSS(color.hex) }}
              />
              {color.name}
              <button
                type="button"
                onClick={() => remove(color.name)}
                className="ml-0.5 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Preset palette grid */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Preset palette — click to add/remove
        </p>
        <div className="flex flex-wrap gap-2">
          {FASHION_COLORS.map(color => {
            const selected = isSelected(color);
            return (
              <button
                key={color.name}
                type="button"
                title={color.name}
                onClick={() => toggle(color)}
                className={cn(
                  'relative h-8 w-8 rounded-full transition-all focus:outline-none',
                  'ring-offset-2 focus:ring-2 focus:ring-primary/50',
                  selected ? 'ring-2 ring-primary scale-110 shadow-md' : 'hover:scale-110 hover:shadow-sm',
                  isLightColor(color.hex) && 'border border-slate-300'
                )}
                style={{ background: colorToCSS(color.hex) }}
              >
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check
                      className={cn(
                        'h-3.5 w-3.5',
                        isLightColor(color.hex) ? 'text-slate-700' : 'text-white'
                      )}
                      strokeWidth={3}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom color */}
      {showCustom ? (
        <div className="flex items-end gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="space-y-1 flex-1">
            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Color Name
            </Label>
            <Input
              placeholder="e.g. Dusty Rose"
              className="h-9 rounded-lg text-xs"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              Hex
            </Label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={customHex}
                onChange={e => setCustomHex(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 p-0.5"
              />
              <Input
                className="h-9 w-24 rounded-lg text-xs font-mono"
                value={customHex}
                onChange={e => setCustomHex(e.target.value)}
                maxLength={7}
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest"
            onClick={addCustom}
          >
            Add
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 rounded-lg"
            onClick={() => setShowCustom(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" /> Add custom color
        </button>
      )}
    </div>
  );
}
