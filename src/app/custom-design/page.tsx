'use client';

import { FormEvent, useState } from 'react';
import { Check, ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import { PosterSize } from '@prisma/client';
import { SIZE_BASE_PRICE, SIZE_LABELS } from '@/types';

const SIZES = Object.keys(SIZE_LABELS) as PosterSize[];
const formatINR = (paise: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(paise / 100);

export default function CustomDesignPage() {
  const [size, setSize] = useState<PosterSize>('A4');
  const [quantity, setQuantity] = useState(1);
  const [artwork, setArtwork] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ id: string; estimatedCost: number } | null>(null);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!artwork) {
      setError('Choose an artwork image to continue.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set('artwork', artwork);
    setBusy(true);
    try {
      const response = await fetch('/api/custom-design', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not submit your request.');
      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page py-10 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <section className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow">Custom print request</p>
            <h1 className="mt-3 max-w-md text-4xl font-display leading-tight">Your image, made wall-worthy.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-ink/60">
              Send us your artwork and print preferences. We’ll review the file and confirm the final quote before production.
            </p>
            <div className="mt-10 border-t border-line pt-6">
              <div className="flex items-start gap-3">
                <ImagePlus size={18} className="mt-0.5 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Print estimate</p>
                  <p className="mt-1 text-xs leading-5 text-ink/55">
                    {formatINR(SIZE_BASE_PRICE[size] * quantity)} for {quantity} {SIZE_LABELS[size].label} print{quantity === 1 ? '' : 's'}. Final pricing is confirmed after artwork review.
                  </p>
                </div>
              </div>
              <p className="mt-6 text-xs text-ink/45">JPG, PNG, or WebP · Up to 8 MB</p>
            </div>
          </section>

          <section className="border-t border-line pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <h2 className="text-lg font-semibold">Request a custom print</h2>
            {result ? (
              <div className="mt-6 border border-emerald-700/20 bg-emerald-700/5 p-5" role="status">
                <Check size={20} className="text-emerald-700" aria-hidden="true" />
                <p className="mt-3 font-medium">Request received</p>
                <p className="mt-1 text-sm text-ink/60">Reference {result.id}. Your print estimate is {formatINR(result.estimatedCost)}; final pricing is confirmed after review.</p>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-ink/65">
                    Name
                    <input name="name" required minLength={2} maxLength={100} autoComplete="name" className="input-field mt-2 w-full" />
                  </label>
                  <label className="block text-xs font-medium text-ink/65">
                    Email
                    <input name="email" type="email" required maxLength={254} autoComplete="email" className="input-field mt-2 w-full" />
                  </label>
                </div>
                <label className="block text-xs font-medium text-ink/65">
                  Phone
                  <input name="phone" type="tel" required minLength={8} maxLength={20} autoComplete="tel" className="input-field mt-2 w-full" />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-ink/65">
                    Print size
                    <select name="size" value={size} onChange={(event) => setSize(event.target.value as PosterSize)} className="input-field mt-2 w-full">
                      {SIZES.map((option) => (
                        <option key={option} value={option}>{SIZE_LABELS[option].label} · {SIZE_LABELS[option].dims}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-ink/65">
                    Quantity
                    <input name="quantity" type="number" min={1} max={25} value={quantity} onChange={(event) => setQuantity(Math.min(25, Math.max(1, Number(event.target.value) || 1)))} className="input-field mt-2 w-full" />
                  </label>
                </div>

                <label className="block text-xs font-medium text-ink/65">
                  Artwork file
                  <span className="mt-2 flex min-h-24 cursor-pointer items-center gap-3 border border-dashed border-ink/25 px-4 py-4 transition-colors hover:border-accent">
                    <Upload size={17} className="shrink-0 text-accent" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink/65">{artwork?.name ?? 'Choose a JPG, PNG, or WebP image'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" required className="sr-only" onChange={(event) => setArtwork(event.target.files?.[0] ?? null)} />
                  </span>
                </label>

                <label className="block text-xs font-medium text-ink/65">
                  Notes <span className="font-normal text-ink/40">(optional)</span>
                  <textarea name="notes" rows={4} maxLength={2000} placeholder="Tell us about crop, finish, or any details we should know." className="input-field mt-2 w-full resize-y" />
                </label>

                {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
                <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-2 bg-ink px-5 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60">
                  {busy ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : null}
                  {busy ? 'Sending request' : 'Send for review'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}