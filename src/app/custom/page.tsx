'use client';

import { useState, useRef } from 'react';
import { Upload, Sparkles, Check, ShoppingBag, Loader2, RefreshCw, Eye, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartContext';
import { formatINR } from '@/lib/utils';
import { RoomVisualizer } from '@/components/product/RoomVisualizer';

const SIZES = [
  { id: 'A5', label: 'A5', dims: '148 × 210 mm', mult: 1 },
  { id: 'A4', label: 'A4', dims: '210 × 297 mm', mult: 1.5 },
  { id: 'A3', label: 'A3', dims: '297 × 420 mm', mult: 2.2 },
  { id: 'A2', label: 'A2', dims: '420 × 594 mm', mult: 3.2 },
  { id: 'A1', label: 'A1', dims: '594 × 841 mm', mult: 4.5 },
];

const MATERIALS = [
  { id: 'MATTE', label: 'Archival Matte', desc: 'Non-reflective, smooth 300 GSM cotton texture', addon: 0 },
  { id: 'GLOSSY', label: 'Vibrant Glossy', desc: 'High-contrast, deep blacks with luster finish', addon: 5000 },
  { id: 'TEXTURED', label: 'Fine-Art Textured', desc: 'Museum watercolor paper feel with tactile grain', addon: 8000 },
];

const FRAMES = [
  { id: 'NONE', label: 'No Frame', desc: 'Rolled securely in rigid mailing tube', addon: 0, style: 'border-0 shadow-lg' },
  { id: 'BLACK', label: 'Matte Black Frame', desc: 'Solid wood frame with acrylic glass', addon: 30000, style: 'border-[8px] border-[#181818] shadow-2xl ring-1 ring-black/40' },
  { id: 'WHITE', label: 'Gallery White Frame', desc: 'Clean minimalist white timber frame', addon: 30000, style: 'border-[8px] border-[#FCFCFC] shadow-2xl ring-1 ring-black/10' },
  { id: 'WOOD', label: 'Natural Oak Frame', desc: 'Warm organic oak grain finish', addon: 45000, style: 'border-[8px] border-[#A87948] shadow-2xl ring-1 ring-black/20' },
];

const BASE_PRICE = 29900; // ₹299 for A5 Matte No-Frame

const SAMPLE_ARTWORKS = [
  { name: 'Tokyo Neon', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80' },
  { name: 'Minimalist Architecture', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Moody Ocean', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80' },
];

export default function CustomPosterPage() {
  const { openCart } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>(SAMPLE_ARTWORKS[0].url);
  const [title, setTitle] = useState('My Custom Masterpiece');
  const [size, setSize] = useState('A3');
  const [material, setMaterial] = useState('MATTE');
  const [frame, setFrame] = useState('BLACK');
  const [quantity, setQuantity] = useState(1);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live price
  const selectedSize = SIZES.find((s) => s.id === size) || SIZES[0];
  const selectedMaterial = MATERIALS.find((m) => m.id === material) || MATERIALS[0];
  const selectedFrame = FRAMES.find((f) => f.id === frame) || FRAMES[0];

  const unitPricePaise = Math.round(BASE_PRICE * selectedSize.mult) + selectedMaterial.addon + selectedFrame.addon;
  const totalPricePaise = unitPricePaise * quantity;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.url) {
        setImageUrl(json.url);
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      } else {
        // Fallback to local Object URL if Cloudinary is not configured in dev
        const localUrl = URL.createObjectURL(file);
        setImageUrl(localUrl);
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch {
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    } finally {
      setUploading(false);
    }
  };

  const handleAddToCart = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/custom-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          title,
          size,
          material,
          frame,
          quantity,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add custom poster.');

      // Open slide-out cart
      openCart();
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-page py-10 lg:py-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="eyebrow">Studio</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display mt-2 mb-3">
          Create Your Custom Print
        </h1>
        <p className="text-sm text-ink/60 leading-relaxed">
          Upload your personal photography, digital art, or family memories. We print on archival 300 GSM museum cotton paper and frame it by hand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Left column: Live Preview Stage */}
        <div className="lg:col-span-6 lg:sticky lg:top-28">
          <div className="bg-line/20 border border-line rounded-sm p-6 sm:p-10 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
            {/* Live Framed Poster Preview */}
            <div className={`relative w-56 sm:w-72 aspect-[3/4] bg-white transition-all duration-300 ${selectedFrame.style}`}>
              <Image
                src={imageUrl}
                alt="Custom Preview"
                fill
                sizes="(max-width: 768px) 300px, 400px"
                className="object-cover"
              />
              {selectedFrame.id !== 'NONE' && (
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
              )}
            </div>

            {/* Stage bottom actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 z-10">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-primary text-xs gap-2 py-2 px-4 shadow-sm"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload Your Image
              </button>

              <RoomVisualizer
                imageUrl={imageUrl}
                title={title}
                frame={frame as any}
                triggerButton={
                  <button className="btn btn-ghost text-xs gap-1.5 py-2 px-4 bg-white/80 backdrop-blur">
                    <Eye size={14} className="text-accent" />
                    Preview on Wall
                  </button>
                }
              />
            </div>

            {/* Sample Artworks toggle */}
            <div className="mt-6 pt-5 border-t border-line/60 w-full flex items-center justify-center gap-2 text-xs text-ink/50">
              <span className="text-[11px] uppercase tracking-wider text-ink/40">Try sample:</span>
              {SAMPLE_ARTWORKS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => {
                    setImageUrl(sample.url);
                    setTitle(sample.name);
                  }}
                  className={`text-[11px] px-2 py-1 rounded-sm border transition-colors ${
                    imageUrl === sample.url ? 'border-accent text-accent font-medium' : 'border-line hover:border-ink/30'
                  }`}
                >
                  {sample.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-4 mt-6 text-xs text-ink/60">
            <div className="flex items-start gap-2.5 p-3.5 border border-line rounded-sm bg-white">
              <ShieldCheck size={16} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">Giclée Quality</p>
                <p className="text-[11px] text-ink/50 mt-0.5">12-color archival pigment ink rated 100+ years.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 border border-line rounded-sm bg-white">
              <Truck size={16} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">Secure Packaging</p>
                <p className="text-[11px] text-ink/50 mt-0.5">Reinforced crash-proof box with corner protectors.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Customization Options */}
        <div className="lg:col-span-6 space-y-8">
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-4 rounded-sm border border-red-200">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2">
              Print Title / Label
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kyoto Golden Hour"
              className="input text-sm font-medium"
            />
          </div>

          {/* 1. Size Selection */}
          <div>
            <div className="flex items-baseline justify-between mb-2.5">
              <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider">
                1. Select Dimensions
              </label>
              <span className="text-xs text-ink/40 font-mono">{selectedSize.dims}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSize(s.id)}
                  className={`p-3 rounded-sm border text-center transition-all ${
                    size === s.id
                      ? 'border-ink bg-ink text-paper font-semibold shadow-sm'
                      : 'border-line bg-white text-ink/70 hover:border-ink/30'
                  }`}
                >
                  <p className="text-sm font-display">{s.label}</p>
                  <p className="text-[10px] opacity-60 mt-0.5 truncate">{s.dims.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Paper & Material Finish */}
          <div>
            <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2.5">
              2. Paper Material & Finish
            </label>
            <div className="space-y-2">
              {MATERIALS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMaterial(m.id)}
                  className={`w-full p-3.5 rounded-sm border text-left flex items-center justify-between transition-all ${
                    material === m.id
                      ? 'border-accent bg-accent/5 text-ink ring-1 ring-accent'
                      : 'border-line bg-white text-ink/70 hover:border-ink/30'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-ink flex items-center gap-2">
                      {m.label}
                      {material === m.id && <Check size={13} className="text-accent" />}
                    </p>
                    <p className="text-[11px] text-ink/50 mt-0.5">{m.desc}</p>
                  </div>
                  <span className="text-xs font-mono text-ink/70">
                    {m.addon > 0 ? `+${formatINR(m.addon)}` : 'Included'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Framing Options */}
          <div>
            <label className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2.5">
              3. Handcrafted Frame
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {FRAMES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrame(f.id)}
                  className={`p-3.5 rounded-sm border text-left transition-all ${
                    frame === f.id
                      ? 'border-accent bg-accent/5 text-ink ring-1 ring-accent'
                      : 'border-line bg-white text-ink/70 hover:border-ink/30'
                  }`}
                >
                  <p className="text-xs font-semibold text-ink flex items-center justify-between">
                    {f.label}
                    {frame === f.id && <Check size={13} className="text-accent" />}
                  </p>
                  <p className="text-[11px] text-ink/50 mt-1 line-clamp-1">{f.desc}</p>
                  <p className="text-xs font-mono text-ink/80 mt-2 font-medium">
                    {f.addon > 0 ? `+${formatINR(f.addon)}` : 'No extra cost'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Purchase Bar */}
          <div className="border-t border-line pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-ink/50 uppercase tracking-wider">Total Price</p>
              <p className="text-2xl font-display font-medium text-ink mt-0.5">
                {formatINR(totalPricePaise)}
              </p>
              <p className="text-[11px] text-ink/40">Includes taxes & standard courier</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center border border-line rounded-sm bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-ink/60 hover:text-ink text-sm"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-ink/60 hover:text-ink text-sm"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={submitting || uploading}
                className="btn btn-primary flex-1 sm:flex-initial gap-2 text-xs py-3 px-6 shadow-md"
              >
                {submitting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ShoppingBag size={15} />
                )}
                Order Custom Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
