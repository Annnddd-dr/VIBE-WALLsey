'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Expand, X } from 'lucide-react';

export function ProductGallery({ images, title }: { images: { url: string; altText?: string | null }[]; title: string }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const imgs = images.length > 0 ? images : [{ url: '/placeholder-poster.svg', altText: title }];

  return (
    <div>
      <div className="relative aspect-[3/4] bg-line/30 rounded-sm overflow-hidden group">
        <Image 
          src={imgs[active].url} 
          alt={imgs[active].altText ?? title} 
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="empty"
          className="object-cover" 
          priority 
        />
        <button
          onClick={() => setFullscreen(true)}
          aria-label="View fullscreen"
          className="absolute bottom-4 right-4 bg-paper/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Expand size={16} />
        </button>
      </div>
      {imgs.length > 1 && (
        <div className="flex gap-2 mt-3">
          {imgs.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`relative w-16 h-20 rounded-sm overflow-hidden border ${i === active ? 'border-ink' : 'border-line'}`}
            >
              <Image 
                src={img.url} 
                alt="" 
                fill 
                sizes="(max-width: 768px) 80px, 64px"
                loading="lazy"
                className="object-cover" 
              />
            </button>
          ))}
        </div>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-[60] bg-ink/95 flex items-center justify-center p-6" onClick={() => setFullscreen(false)}>
          <button className="absolute top-6 right-6 text-paper" aria-label="Close"><X size={26} /></button>
          <div className="relative w-full max-w-2xl aspect-[3/4]">
            <Image 
              src={imgs[active].url} 
              alt={imgs[active].altText ?? title} 
              fill 
              sizes="(max-width: 768px) 100vw, 90vw"
              className="object-contain" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
