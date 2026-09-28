'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * "View more" — loads the next cumulative batch of products.
 *
 * The plain <a> fallback works without JS (server renders the bigger page);
 * with JS we prefetch the next page for an instant, app-like append.
 */
export function ViewMoreButton({ href, remaining }: { href: string; remaining: number }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  // Clear the pending state if the navigation was interrupted.
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(false), 6000);
    return () => clearTimeout(t);
  }, [pending]);

  const next = Math.min(remaining, 25);

  return (
    <a
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let new-tab through
        e.preventDefault();
        if (pending) return;
        setPending(true);
        router.push(href);
      }}
      className="btn btn-ghost min-w-56 gap-2"
      aria-label={`View more — loads ${next} more posters`}
    >
      {pending ? (
        <>
          <Loader2 size={15} className="animate-spin" /> Loading…
        </>
      ) : (
        <>View more ({next})</>
      )}
    </a>
  );
}
