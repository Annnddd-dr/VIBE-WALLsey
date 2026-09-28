'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, EyeOff, Trash2, Loader2, Star } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  verifiedPurchase: boolean;
  createdAt: string;
  product: { title: string; slug: string };
  user: { name: string | null; email: string };
}

interface Props {
  reviews: ReviewRow[];
  counts: { PENDING: number; APPROVED: number; REJECTED: number };
  activeStatus: string;
}

const STATUS_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

export function AdminReviewsClient({ reviews, counts, activeStatus }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const { show } = useToast();

  async function moderate(id: string, action: 'approve' | 'hide' | 'delete') {
    const confirmed =
      action === 'delete'
        ? window.confirm('Delete this review permanently?')
        : true;
    if (!confirmed) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data.error ?? 'Action failed.', 'error');
        return;
      }
      show(
        action === 'approve'
          ? 'Review approved.'
          : action === 'hide'
          ? 'Review hidden.'
          : 'Review deleted.'
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display">Reviews</h1>
        <p className="text-xs text-ink/40 mt-1">Moderate customer reviews across the catalogue.</p>
      </div>

      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map((t) => (
          <a
            key={t.key}
            href={`/admin/reviews${t.key === 'ALL' ? '' : `?status=${t.key}`}`}
            className={`px-3.5 py-2 text-xs rounded-sm border transition-colors ${
              activeStatus === t.key
                ? 'border-ink bg-ink text-paper font-medium'
                : 'border-line text-ink/60 hover:border-ink/40'
            }`}
          >
            {t.label}
            {t.key !== 'ALL' && ` (${counts[t.key as keyof typeof counts]})`}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="border border-line rounded-sm p-4 sm:p-5 bg-surface/50">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < r.rating ? 'fill-accent' : 'text-line'}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-medium truncate">{r.product.title}</span>
                  {r.verifiedPurchase && (
                    <span className="text-[10px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-sm">
                      Verified purchase
                    </span>
                  )}
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                      r.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : r.status === 'REJECTED'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.title && <p className="text-sm font-medium mt-1.5">{r.title}</p>}
                <p className="text-xs text-ink/60 mt-1 leading-relaxed max-w-2xl">{r.body}</p>
                <p className="text-[11px] text-ink/40 mt-2">
                  {r.user.name ?? r.user.email} · {format(new Date(r.createdAt), 'dd MMM yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {busyId === r.id ? (
                  <Loader2 size={15} className="animate-spin text-ink/40 m-2" />
                ) : (
                  <>
                    {r.status !== 'APPROVED' && (
                      <button
                        onClick={() => moderate(r.id, 'approve')}
                        className="p-2 text-ink/50 hover:text-emerald-600 transition-colors"
                        title="Approve"
                        aria-label="Approve review"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    {r.status !== 'REJECTED' && (
                      <button
                        onClick={() => moderate(r.id, 'hide')}
                        className="p-2 text-ink/50 hover:text-amber-600 transition-colors"
                        title="Hide"
                        aria-label="Hide review"
                      >
                        <EyeOff size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => moderate(r.id, 'delete')}
                      className="p-2 text-ink/50 hover:text-accent transition-colors"
                      title="Delete"
                      aria-label="Delete review"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="border border-line rounded-sm px-4 py-12 text-center text-ink/40 text-sm">
            No reviews {activeStatus !== 'ALL' ? `with status ${activeStatus.toLowerCase()}` : 'yet'}.
          </div>
        )}
      </div>
      <p className="text-[11px] text-ink/30 mt-4">
        Tip: changes reflect immediately on the product page. <Link href="/admin" className="underline">Back to dashboard</Link>
      </p>
    </div>
  );
}
