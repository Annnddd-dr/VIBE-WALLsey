'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Save, Loader2, ExternalLink } from 'lucide-react';

const SHIPMENT_PROVIDERS = [
  'BlueDart',
  'Delhivery',
  'DTDC',
  'FedEx',
  'India Post',
  'Shiprocket',
  'XpressBees',
  'Ecom Express',
  'Other',
];

interface Props {
  orderId: string;
  shipment: {
    provider?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    status?: string | null;
  } | null;
}

export function ShipmentForm({ orderId, shipment }: Props) {
  const router = useRouter();
  const [provider, setProvider] = useState(shipment?.provider ?? '');
  const [trackingNumber, setTrackingNumber] = useState(shipment?.trackingNumber ?? '');
  const [trackingUrl, setTrackingUrl] = useState(shipment?.trackingUrl ?? '');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment: {
            provider,
            trackingNumber,
            trackingUrl,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ ok: true, text: 'Tracking details saved.' });
        setDirty(false);
        router.refresh();
      } else {
        setMessage({ ok: false, text: data.error ?? 'Failed to save tracking details.' });
      }
    });
  }

  return (
    <form onSubmit={save} className="border border-line rounded-sm p-5 bg-white">
      <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-ink/60">
        <Truck size={14} className="text-accent" />
        <span>Shipment & Tracking</span>
        {shipment?.status && shipment.status !== 'NOT_SHIPPED' && (
          <span className="ml-auto normal-case font-medium text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm">
            {shipment.status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="text-ink/50 mb-1 block">Courier</span>
          <select
            value={provider}
            onChange={(e) => { setProvider(e.target.value); setDirty(true); }}
            className="w-full border border-line rounded-sm px-3 py-2 text-sm bg-white"
          >
            <option value="">— Select courier —</option>
            {SHIPMENT_PROVIDERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="text-ink/50 mb-1 block">Tracking Number</span>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => { setTrackingNumber(e.target.value); setDirty(true); }}
            placeholder="e.g. DLXN1234567890"
            className="w-full border border-line rounded-sm px-3 py-2 text-sm bg-white"
          />
        </label>

        <label className="block text-xs sm:col-span-2">
          <span className="text-ink/50 mb-1 block">Tracking URL</span>
          <input
            type="text"
            value={trackingUrl}
            onChange={(e) => { setTrackingUrl(e.target.value); setDirty(true); }}
            placeholder="https://bluedart.com/tracking/…"
            className="w-full border border-line rounded-sm px-3 py-2 text-sm bg-white"
          />
        </label>
      </div>

      {shipment?.trackingNumber && (
        <a
          href={shipment.trackingUrl ?? `https://www.google.com/search?q=${encodeURIComponent(shipment.trackingNumber)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent mt-3 hover:underline"
        >
          <ExternalLink size={12} /> Track via courier
        </a>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="btn btn-primary text-xs gap-1.5 inline-flex items-center disabled:opacity-50"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {pending ? 'Saving…' : 'Save Tracking'}
        </button>
        {message && (
          <span className={`text-xs ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}