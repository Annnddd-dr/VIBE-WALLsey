'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PackageSearch, Truck, Copy, Check, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ShipmentRow {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  provider: string | null;
  trackingNumber: string | null;
  status: string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

interface Props {
  shipments: ShipmentRow[];
  unshipped: { id: string; orderNumber: string; status: string }[];
  freeThreshold: number;
  flatRate: number;
}

export function AdminShippingClient({ shipments, unshipped, freeThreshold, flatRate }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [editFreeThreshold, setEditFreeThreshold] = useState(freeThreshold);
  const [editFlatRate, setEditFlatRate] = useState(flatRate);
  const { show } = useToast();

  const [saving, setSaving] = useState(false);

  async function handleSaveRates() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shipping/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingThreshold: Math.max(0, Math.round(editFreeThreshold)),
          flatShippingRate: Math.max(0, Math.round(editFlatRate)),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        show(json.error || 'Could not save shipping rates.', 'error');
        return;
      }
      setEditFreeThreshold(json.freeShippingThreshold);
      setEditFlatRate(json.flatShippingRate);
      show('Shipping rates saved — live on the storefront.', 'success');
    } catch {
      show('Network error — could not save rates.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function copyTracking(tracking: string) {
    try {
      await navigator.clipboard.writeText(tracking);
      setCopied(tracking);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      show('Could not copy to clipboard.', 'error');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display">Shipping</h1>
        <p className="text-xs text-ink/40 mt-1">Shipments, tracking and delivery rates.</p>
      </div>

      {/* Rates card */}
      <div className="mb-8">
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="border border-line rounded-sm p-5 bg-surface/50 focus-within:border-ink/30 transition-colors">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink/50 mb-3">
              <Truck size={14} className="text-accent" /> Free shipping threshold
            </div>
            <div className="flex items-center text-2xl font-display">
              <span className="text-ink/50 mr-2">₹</span>
              <input
                type="number"
                value={editFreeThreshold}
                onChange={(e) => setEditFreeThreshold(Number(e.target.value))}
                className="bg-transparent border-none outline-none w-full text-ink p-0 m-0 font-display focus:ring-0"
              />
            </div>
            <p className="text-[11px] text-ink/40 mt-2">
              Applies site-wide immediately.
            </p>
          </div>
          <div className="border border-line rounded-sm p-5 bg-surface/50 focus-within:border-ink/30 transition-colors">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink/50 mb-3">
              <Truck size={14} className="text-accent" /> Flat rate below threshold
            </div>
            <div className="flex items-center text-2xl font-display">
              <span className="text-ink/50 mr-2">₹</span>
              <input
                type="number"
                value={editFlatRate}
                onChange={(e) => setEditFlatRate(Number(e.target.value))}
                className="bg-transparent border-none outline-none w-full text-ink p-0 m-0 font-display focus:ring-0"
              />
            </div>
            <p className="text-[11px] text-ink/40 mt-2">
              Applies site-wide immediately.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveRates}
            disabled={saving}
            className="btn btn-primary text-xs py-2 px-6 rounded-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Rates'}
          </button>
        </div>
      </div>

      {/* Unshipped orders prompt */}
      {unshipped.length > 0 && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-sm p-4 mb-8 flex items-start gap-3">
          <Clock size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-ink/70">
            <p className="font-semibold text-ink mb-0.5">{unshipped.length} paid order(s) without a shipment record</p>
            <p>
              Open{' '}
              {unshipped.slice(0, 3).map((o, i) => (
                <span key={o.id}>
                  {i > 0 && ', '}
                  <a href={`/admin/orders/${o.id}`} className="text-accent hover:underline font-medium">
                    {o.orderNumber}
                  </a>
                </span>
              ))}
              {unshipped.length > 3 && ` and ${unshipped.length - 3} more`} to add tracking details.
            </p>
          </div>
        </div>
      )}

      {/* Shipments table */}
      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Provider</th>
              <th className="text-left px-4 py-3">Tracking</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Shipped</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-t border-line hover:bg-line/10">
                <td className="px-4 py-3">
                  <a href={`/admin/orders/${s.orderId}`} className="text-accent hover:underline font-medium">
                    {s.orderNumber}
                  </a>
                </td>
                <td className="px-4 py-3 text-ink/60">{s.provider ?? '—'}</td>
                <td className="px-4 py-3">
                  {s.trackingNumber ? (
                    <button
                      onClick={() => copyTracking(s.trackingNumber!)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-ink/70 hover:text-ink"
                      title="Copy tracking number"
                    >
                      {s.trackingNumber}
                      {copied === s.trackingNumber ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  ) : (
                    <span className="text-ink/30">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-sm bg-line/50 text-ink/70">{s.status}</span>
                </td>
                <td className="px-4 py-3 text-ink/60 text-xs">
                  {s.shippedAt ? format(new Date(s.shippedAt), 'dd MMM, HH:mm') : <span className="text-ink/30">—</span>}
                </td>
              </tr>
            ))}
            {shipments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <PackageSearch className="mx-auto mb-2 text-ink/20" size={24} />
                  <p className="text-ink/40 text-sm">No shipments recorded yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
