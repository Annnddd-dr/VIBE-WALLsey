'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CouponRowActions({
  couponId,
  isActive,
}: {
  couponId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  const toggleActive = async () => {
    setLoading(true);
    try {
      const nextState = !active;
      setActive(nextState);
      await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState }),
      });
      router.refresh();
    } catch {
      setActive(active);
    } finally {
      setLoading(false);
    }
  };

  const deleteCoupon = async () => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch {
      alert('Failed to delete coupon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-sm border transition-colors ${
          active
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:bg-neutral-200'
        }`}
      >
        {active ? 'Active' : 'Inactive'}
      </button>

      <button
        onClick={deleteCoupon}
        disabled={loading}
        className="text-ink/30 hover:text-red-600 p-1 transition-colors"
        title="Delete coupon"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}
