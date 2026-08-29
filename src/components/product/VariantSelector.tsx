'use client';

import { useMemo, useState } from 'react';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCart } from '@/components/cart/CartContext';
import { SIZE_LABELS, MATERIAL_LABELS, FRAME_LABELS } from '@/types';
import { PosterSize, PosterMaterial, PosterFrame } from '@prisma/client';

interface VariantLite {
  id: string;
  size: PosterSize;
  material: PosterMaterial;
  frame: PosterFrame;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export function VariantSelector({ variants }: { variants: VariantLite[] }) {
  const sizes = Array.from(new Set(variants.map((v) => v.size)));
  const materials = Array.from(new Set(variants.map((v) => v.material)));
  const frames = Array.from(new Set(variants.map((v) => v.frame)));

  const [size, setSize] = useState(sizes[0]);
  const [material, setMaterial] = useState(materials[0]);
  const [frame, setFrame] = useState(frames[0]);
  const [qty, setQty] = useState(1);
  const { addItem, openCart, loading } = useCart();

  const selected = useMemo(
    () => variants.find((v) => v.size === size && v.material === material && v.frame === frame) ?? null,
    [variants, size, material, frame]
  );

  const outOfStock = selected ? selected.stock <= 0 : true;

  return (
    <div className="space-y-6">
      {selected && <PriceDisplay price={selected.price} compareAt={selected.compareAtPrice} />}

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-2">Size</p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`px-3 py-2 text-sm border rounded-sm ${s === size ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
            >
              {SIZE_LABELS[s].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink/40 mt-1.5">{SIZE_LABELS[size].dims}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-2">Material</p>
        <div className="flex flex-wrap gap-2">
          {materials.map((m) => (
            <button
              key={m}
              onClick={() => setMaterial(m)}
              className={`px-3 py-2 text-sm border rounded-sm ${m === material ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
            >
              {MATERIAL_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-2">Frame</p>
        <div className="flex flex-wrap gap-2">
          {frames.map((f) => (
            <button
              key={f}
              onClick={() => setFrame(f)}
              className={`px-3 py-2 text-sm border rounded-sm ${f === frame ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'}`}
            >
              {FRAME_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-2">Quantity</p>
        <div className="flex items-center border border-line rounded-sm w-fit">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="px-4 text-sm">{qty}</span>
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
        </div>
      </div>

      {!selected ? (
        <p className="text-sm text-accent">This combination isn't available.</p>
      ) : outOfStock ? (
        <p className="text-sm text-accent">Out of stock in this combination.</p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-3">
        <button disabled={!selected || outOfStock || loading} onClick={() => selected && addItem(selected.id, qty)} className="btn btn-primary flex-1">
          Add to Cart
        </button>
        <button
          disabled={!selected || outOfStock || loading}
          onClick={async () => {
            if (!selected) return;
            await addItem(selected.id, qty);
            openCart();
          }}
          className="btn btn-accent flex-1"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
