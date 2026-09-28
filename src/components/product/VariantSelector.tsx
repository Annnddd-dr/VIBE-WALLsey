'use client';

import { useMemo, useState } from 'react';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { useCart } from '@/components/cart/CartContext';
import { SIZE_LABELS } from '@/types';
import { PosterSize } from '@prisma/client';

interface VariantLite {
  id: string;
  size: PosterSize;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

export function VariantSelector({ variants }: { variants: VariantLite[] }) {
  // Sizes only — one finish per size (premium matte, unframed).
  const sizeOrder = ['POLAROID', 'A6', 'A5', 'A4', 'A3'];
  const sizes = Array.from(new Set(variants.map((v) => v.size))).sort(
    (a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
  );

  const [size, setSize] = useState(sizes[0]);
  const [qty, setQty] = useState(1);
  const { addItem, openCart, loading } = useCart();

  const selected = useMemo(
    () => variants.find((v) => v.size === size) ?? null,
    [variants, size]
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
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-2">Quantity</p>
        <div className="flex items-center border border-line rounded-sm w-fit">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="px-4 text-sm">{qty}</span>
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(10, q + 1))}>+</button>
        </div>
      </div>

      {!selected ? (
        <p className="text-sm text-accent">This size isn&apos;t available.</p>
      ) : outOfStock ? (
        <p className="text-sm text-accent">Out of stock in this size.</p>
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
