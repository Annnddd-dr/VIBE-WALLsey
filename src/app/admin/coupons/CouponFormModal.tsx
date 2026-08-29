'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CouponFormModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState(10);
  const [minOrderRupees, setMinOrderRupees] = useState(0);
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [maxUsage, setMaxUsage] = useState<string>('');
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type,
          value: type === 'FIXED' ? value * 100 : value, // store FIXED in paise
          minOrderAmount: minOrderRupees * 100, // store in paise
          firstOrderOnly,
          maxUsage: maxUsage ? parseInt(maxUsage) : null,
          perUserLimit,
          expiresAt: expiresAt || null,
          isActive: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create coupon.');

      setOpen(false);
      setCode('');
      setValue(10);
      setMinOrderRupees(0);
      setFirstOrderOnly(false);
      setMaxUsage('');
      setExpiresAt('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary gap-2 text-xs"
      >
        <Plus size={15} />
        New Coupon
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-paper border border-line rounded-sm max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-ink/40 hover:text-ink"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-display mb-4">Create Coupon</h2>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-ink/60 font-medium mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="SUMMER20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="input uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="input"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink/60 font-medium mb-1">
                    {type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={type === 'PERCENTAGE' ? 100 : 100000}
                    value={value}
                    onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderRupees}
                    onChange={(e) => setMinOrderRupees(parseInt(e.target.value) || 0)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Total Max Usages</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Per User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(parseInt(e.target.value) || 1)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="firstOrderOnly"
                  checked={firstOrderOnly}
                  onChange={(e) => setFirstOrderOnly(e.target.checked)}
                  className="rounded-sm border-line text-accent focus:ring-accent"
                />
                <label htmlFor="firstOrderOnly" className="text-ink/80 cursor-pointer">
                  Valid for first order only
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary text-xs"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
