'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, X, GripVertical, AlertCircle, Image as ImageIcon } from 'lucide-react';

export interface ImageItem {
  url: string;
  altText?: string;
  publicId?: string;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      setUploading(true);

      const newImages: ImageItem[] = [];

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
          const json = await res.json();

          if (!res.ok) {
            // If Cloudinary isn't configured, show the URL fallback
            if (res.status === 503) {
              setError('Cloudinary not configured. Use "Add by URL" instead.');
              setShowUrlInput(true);
              break;
            }
            throw new Error(json.error || 'Upload failed');
          }

          newImages.push({ url: json.url, publicId: json.publicId });
        } catch (err: any) {
          setError(err.message || 'Upload failed');
        }
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
      setUploading(false);
    },
    [images, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles]
  );

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const addByUrl = () => {
    if (!manualUrl.trim()) return;
    try {
      new URL(manualUrl);
      onChange([...images, { url: manualUrl.trim() }]);
      setManualUrl('');
      setError(null);
    } catch {
      setError('Invalid URL');
    }
  };

  // --- Drag-to-reorder ---
  const handleReorderDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleReorderDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    onChange(reordered);
    setDragIdx(idx);
  };

  const handleReorderDragEnd = () => {
    setDragIdx(null);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-sm p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-line hover:border-ink/30'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <Upload size={24} className="mx-auto text-ink/30 mb-2" />
        <p className="text-sm text-ink/50">
          {uploading ? (
            <span className="text-accent">Uploading…</span>
          ) : (
            <>
              Drag & drop images here, or <span className="text-accent underline">browse</span>
            </>
          )}
        </p>
        <p className="text-xs text-ink/30 mt-1">JPEG, PNG, WebP — max 5 MB each</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Manual URL input */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addByUrl()}
            placeholder="https://example.com/image.jpg"
            className="input flex-1"
          />
          <button type="button" onClick={addByUrl} className="btn btn-ghost text-xs">
            Add
          </button>
        </div>
      )}
      {!showUrlInput && (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="text-xs text-ink/40 hover:text-ink/60 transition-colors"
        >
          or add by URL →
        </button>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={`${img.url}-${idx}`}
              className={`group relative border rounded-sm overflow-hidden bg-line/20 aspect-[3/4] transition-shadow ${
                dragIdx === idx ? 'opacity-50 ring-2 ring-accent' : 'hover:shadow-md'
              }`}
              draggable
              onDragStart={() => handleReorderDragStart(idx)}
              onDragOver={(e) => handleReorderDragOver(e, idx)}
              onDragEnd={handleReorderDragEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText || `Image ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Position badge */}
              {idx === 0 && (
                <span className="absolute top-2 left-2 text-[10px] font-semibold bg-accent text-white px-1.5 py-0.5 rounded-sm">
                  HERO
                </span>
              )}
              {/* Controls overlay */}
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="bg-white/90 text-red-600 p-1.5 rounded-sm shadow-sm hover:bg-red-50 transition-colors"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
                <span className="bg-white/90 text-ink/50 p-1.5 rounded-sm shadow-sm cursor-grab" title="Drag to reorder">
                  <GripVertical size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-ink/30 py-2">
          <ImageIcon size={14} />
          No images added yet
        </div>
      )}
    </div>
  );
}
