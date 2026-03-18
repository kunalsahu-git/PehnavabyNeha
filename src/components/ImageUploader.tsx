'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, folder, className }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.');
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {value ? (
        /* Image preview with replace/remove */
        <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 group">
          <Image src={value} alt="Cover" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest bg-white text-slate-900 hover:bg-white"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange('')}
              className="rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest"
            >
              <X className="h-3.5 w-3.5 mr-1.5" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={cn(
            'w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all',
            dragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-slate-200 bg-slate-50/50 hover:border-primary/50 hover:bg-primary/5',
            isUploading && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Uploading...</p>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-primary/60" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  Drop image here or <span className="text-primary">browse</span>
                </p>
                <p className="text-[10px] text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
              </div>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-[10px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
