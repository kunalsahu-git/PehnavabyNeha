'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadFile, type UploadResult } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  value?: string;
  type?: 'image' | 'video';
  onChange: (result: UploadResult | null) => void;
  folder?: string;
  className?: string;
  label?: string;
  accept?: string;
}

export function FileUploader({ 
  value, 
  type = 'image', 
  onChange, 
  folder, 
  className,
  label,
  accept 
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultAccept = type === 'video' ? 'video/*' : 'image/*';

  const handleFile = async (file: File) => {
    if (type === 'image' && !file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
      setError('Please select a video file.');
      return;
    }
    
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      setError(`${type === 'video' ? 'Video' : 'Image'} must be under ${type === 'video' ? '50MB' : '10MB'}.`);
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const result = await uploadFile(file, folder);
      onChange(result);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
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
        accept={accept || defaultAccept}
        className="hidden"
        onChange={handleInputChange}
      />

      {value ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 group border border-slate-200">
          {type === 'video' ? (
            <video 
              src={value} 
              className="w-full h-full object-cover" 
              muted 
              playsInline
              onMouseOver={e => (e.target as HTMLVideoElement).play()}
              onMouseOut={e => (e.target as HTMLVideoElement).pause()}
            />
          ) : (
            <Image src={value} alt="Preview" fill className="object-cover" />
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
              onClick={() => onChange(null)}
              className="rounded-xl h-9 text-[10px] font-bold uppercase tracking-widest"
            >
              <X className="h-3.5 w-3.5 mr-1.5" /> Remove
            </Button>
          </div>
          {type === 'video' && (
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md rounded-lg p-1.5 text-white">
              <Film className="h-3 w-3" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={cn(
            'w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all',
            dragOver
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-slate-200 bg-slate-50/50 hover:border-primary/50 hover:bg-primary/5',
            isUploading && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Uploading {type}...</p>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                {type === 'video' ? <Film className="h-6 w-6 text-primary/60" /> : <ImageIcon className="h-6 w-6 text-primary/60" />}
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  {label || `Drop ${type} here or browse`}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                  {type === 'video' ? 'MP4, MOV up to 50MB' : 'PNG, JPG, WEBP up to 10MB'}
                </p>
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
