'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

const STATUSES = [
  'PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'PRINTING', 'PACKED',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED',
];

const QUICK_PATHS: { from: string; to: string; label: string }[] = [
  { from: 'PAID', to: 'PROCESSING', label: 'Start Processing' },
  { from: 'PROCESSING', to: 'PRINTING', label: 'Printing Started' },
  { from: 'PRINTING', to: 'PACKED', label: 'Packed & Framed' },
  { from: 'PACKED', to: 'SHIPPED', label: 'Mark Shipped' },
  { from: 'SHIPPED', to: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { from: 'OUT_FOR_DELIVERY', to: 'DELIVERED', label: 'Mark Delivered' },
];

export function StatusManager({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  async function updateStatus(next: string) {
    // Confirm destructive transitions
    const destructive = ['CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED'];
    if (destructive.includes(next)) {
      const confirmed = window.confirm(
        `Mark this order as ${next.replace(/_/g, ' ').toLowerCase()}? This cannot be undone automatically.`
      );
      if (!confirmed) return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: `Status updated to ${next.replace(/_/g, ' ')}.` });
        router.refresh();
      } else {
        setMessage({ ok: false, text: data.error ?? 'Failed to update status.' });
      }
    });
  }

  const quickPath = QUICK_PATHS.find((q) => q.from === status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => updateStatus(e.target.value)}
          disabled={pending}
          className="text-xs border border-line rounded-sm px-2.5 py-2 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        {quickPath && (
          <button
            type="button"
            disabled={pending}
            onClick={() => updateStatus(quickPath.to)}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-ink text-white rounded-sm px-3 py-2 hover:bg-ink/80 disabled:opacity-50 transition-colors"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
            {quickPath.label}
          </button>
        )}
      </div>
      {message && (
        <p className={`text-xs ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</p>
      )}
    </div>
  );
}