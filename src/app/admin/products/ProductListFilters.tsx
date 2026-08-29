'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Search } from 'lucide-react';

interface ProductListFiltersProps {
  categories: { id: string; name: string }[];
}

export function ProductListFilters({ categories }: ProductListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'ALL';
  const category = searchParams.get('category') ?? 'ALL';

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === '' || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          type="text"
          defaultValue={q}
          placeholder="Search by title…"
          className="input pl-8 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('q', (e.target as HTMLInputElement).value);
            }
          }}
          onBlur={(e) => updateParam('q', e.target.value)}
        />
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => updateParam('status', e.target.value)}
        className="input text-xs w-auto"
      >
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </select>

      {/* Category filter */}
      <select
        value={category}
        onChange={(e) => updateParam('category', e.target.value)}
        className="input text-xs w-auto"
      >
        <option value="ALL">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
