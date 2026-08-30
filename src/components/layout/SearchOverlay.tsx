'use client';

import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { X, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatINR } from '@/lib/utils';

interface Result {
  slug: string;
  title: string;
  image: string | null;
  price: number;
}

const POPULAR = ['Anime posters', 'Minimalist', 'Movie posters', 'Cars', 'Gaming'];

function SearchOverlayContent({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      
      // Cancel previous request if exists
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: abortControllerRef.current.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Search error:', error);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-paper">
      <div className="container-page py-6">
        <div className="flex items-center gap-4 border-b border-line pb-4">
          <Search size={20} className="text-ink/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posters, artists, categories..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-ink/30"
          />
          <button onClick={onClose} aria-label="Close search">
            <X size={22} />
          </button>
        </div>

        <div className="mt-8 max-w-2xl mx-auto">
          {query.trim().length < 2 ? (
            <div>
              <p className="eyebrow mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button key={p} onClick={() => setQuery(p)} className="btn btn-ghost text-xs px-3 py-2">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <p className="text-ink/50 text-sm">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-ink/50 text-sm">
  No results for &quot;{query}&quot;.
</p>
          ) : (
            <ul className="space-y-4">
              {results.map((r) => (
                <li key={r.slug}>
                  <Link href={`/product/${r.slug}`} onClick={onClose} className="flex items-center gap-4 group">
                    <div className="w-14 h-16 bg-line/40 rounded-sm overflow-hidden shrink-0">
                      {r.image ? (
                        <Image
                          src={r.image}
                          alt={r.title}
                          width={100}
                          height={100}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm group-hover:text-accent transition-colors">{r.title}</p>
                      <p className="text-xs text-ink/50">{formatINR(r.price)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export const SearchOverlay = memo(SearchOverlayContent);
