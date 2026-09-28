'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const SIZES = ['POLAROID', 'A6', 'A5', 'A4', 'A3'];
const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'bestselling', label: 'Best Selling' },
  { value: 'rating', label: 'Highest Rated' },
];

export function ShopFilters({ categories, activeParams }: { categories: { slug: string; name: string }[]; activeParams: Record<string, string | undefined> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const Content = (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-3">Sort by</p>
        <select className="input text-sm" value={activeParams.sort ?? 'featured'} onChange={(e) => setParam('sort', e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-3">Category</p>
        <ul className="space-y-2">
          <li><button onClick={() => setParam('category')} className={`text-sm ${!activeParams.category ? 'text-accent' : 'text-ink/70'}`}>All</button></li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button onClick={() => setParam('category', c.slug)} className={`text-sm ${activeParams.category === c.slug ? 'text-accent' : 'text-ink/70'}`}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink/50 mb-3">Size</p>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} onClick={() => setParam('size', activeParams.size === s ? undefined : s)} className={`px-3 py-1.5 text-xs border rounded-sm ${activeParams.size === s ? 'border-ink bg-ink text-paper' : 'border-line'}`}>
              {s === 'POLAROID' ? 'Polaroid' : s}
            </button>
          ))}
        </div>
      </div>

    </div>
  );

  return (
    <>
      <button className="lg:hidden btn btn-ghost w-full mb-6 flex items-center justify-center gap-2" onClick={() => setMobileOpen(true)}>
        <SlidersHorizontal size={15} /> Filters
      </button>

      <aside className="hidden lg:block">{Content}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-paper lg:hidden overflow-y-auto">
          <div className="container-page py-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display text-lg">Filters</h2>
              <button onClick={() => setMobileOpen(false)}><X size={22} /></button>
            </div>
            {Content}
            <button className="btn btn-primary w-full mt-8" onClick={() => setMobileOpen(false)}>Show results</button>
          </div>
        </div>
      )}
    </>
  );
}
