'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageSearch, CheckCircle2, Loader2, Truck, MapPin, AlertCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';
import { formatINR } from '@/lib/utils';
import { DestinationMap } from '@/components/track/DestinationMap';

interface TrackStep {
  key: string;
  label: string;
  state: 'completed' | 'active' | 'upcoming' | 'inactive';
}

interface TrackResult {
  orderNumber: string;
  status: string;
  placedAt: string;
  estimatedDelivery: string;
  cancelled: boolean;
  items: { productTitle: string; variantLabel: string; quantity: number }[];
  shipment: { provider: string | null; trackingNumber: string | null; trackingUrl: string | null } | null;
  destination: { city: string; state: string; pincode: string } | null;
  steps: TrackStep[];
}

function fmt(d: string) {
  try {
    return format(new Date(d), 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

function fmtDateTime(d: string) {
  try {
    return format(new Date(d), "dd MMM yyyy, h:mm a");
  } catch {
    return '—';
  }
}

export function TrackOrderClient({ prefillOrder }: { prefillOrder?: string }) {
  const [orderNumber, setOrderNumber] = useState(prefillOrder ?? '');
  const [contact, setContact] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, contact }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-12 lg:py-20 max-w-3xl">
      <div className="text-center mb-10">
        <p className="eyebrow">Order tracking</p>
        <h1 className="text-3xl lg:text-4xl mt-2">Where&apos;s my wall art?</h1>
        <p className="text-ink-secondary text-sm mt-3 max-w-md mx-auto">
          Enter your order number and the email or mobile you used at checkout.
        </p>
      </div>

      <form onSubmit={lookup} className="glass-card rounded-sm p-6 sm:p-8 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="order-number" className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2">
              Order number
            </label>
            <input
              id="order-number"
              className="input"
              placeholder="VBW-XXXXXX-XXXX"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="track-contact" className="block text-xs font-semibold text-ink/60 uppercase tracking-wider mb-2">
              Email or mobile
            </label>
            <input
              id="track-contact"
              className="input"
              placeholder="you@example.com or 9876543210"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />
          </div>
        </div>
        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto mt-5 gap-2">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <PackageSearch size={15} />}
          Track order
        </button>
      </form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.orderNumber}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="glass-card rounded-sm overflow-hidden"
          >
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 sm:px-8 py-5 border-b border-line">
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/50">Order</p>
                <p className="font-display text-xl">{result.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-ink/50">
                  {result.cancelled ? 'Status' : 'Estimated delivery'}
                </p>
                <p className="text-sm font-medium">
                  {result.cancelled ? result.status.replace(/_/g, ' ') : fmt(result.estimatedDelivery)}
                </p>
              </div>
            </div>

            {result.cancelled ? (
              <div className="px-6 sm:px-8 py-10 text-center">
                <AlertCircle size={28} className="mx-auto text-accent" />
                <p className="mt-3 text-sm text-ink-secondary max-w-sm mx-auto">
                  This order was {result.status.toLowerCase().replace(/_/g, ' ')}. If this is unexpected, contact
                  support@vibewallsey.com and we&apos;ll sort it out.
                </p>
              </div>
            ) : (
              <>
                {/* Timeline */}
                <div className="px-6 sm:px-8 py-8">
                  <ol className="relative">
                    {result.steps.map((step, i) => {
                      const last = i === result.steps.length - 1;
                      const isDone = step.state === 'completed';
                      const isActive = step.state === 'active';
                      const Icon = isDone ? CheckCircle2 : isActive ? Truck : Circle;
                      return (
                        <motion.li
                          key={step.key}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.08 * i, duration: 0.4 }}
                          className="relative flex items-start gap-4 pb-8 last:pb-0"
                        >
                          {!last && (
                            <span
                              className={`absolute left-[15px] top-8 bottom-0 w-px ${
                                isDone ? 'bg-accent' : 'bg-line'
                              }`}
                            />
                          )}
                          <span
                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                              isDone
                                ? 'border-accent bg-accent text-ink'
                                : isActive
                                ? 'border-accent bg-paper text-accent animate-pulse-soft'
                                : 'border-line bg-paper text-ink/30'
                            }`}
                          >
                            <Icon size={15} />
                          </span>
                          <div className="pt-1">
                            <p className={`text-sm font-medium ${step.state === 'upcoming' ? 'text-ink/40' : 'text-ink'}`}>
                              {step.label}
                            </p>
                            {isActive && (
                              <p className="text-xs text-ink-secondary mt-0.5">
                                {step.key === 'SHIPPED' && result.shipment?.trackingNumber
                                  ? `In transit — tracking ${result.shipment.trackingNumber}`
                                  : 'In progress right now'}
                              </p>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>

                {/* Destination map + shipment + items footer */}
                {result.destination && (
                  <div className="px-6 sm:px-8 pt-6">
                    <DestinationMap destination={result.destination} />
                  </div>
                )}

                {/* Shipment + items footer */}
                <div className="border-t border-line px-6 sm:px-8 py-5 space-y-4">
                  {result.shipment?.trackingNumber && (
                    <div className="flex items-center gap-2 text-xs text-ink-secondary">
                      <MapPin size={14} className="text-accent" />
                      <span>
                        {result.shipment.provider ?? 'Courier'} · Tracking{' '}
                        <strong className="text-ink font-mono">{result.shipment.trackingNumber}</strong>
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {result.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-xs text-ink-secondary">
                        <span className="text-ink">
                          {it.productTitle} <span className="text-ink/50">× {it.quantity}</span>
                        </span>
                        <span>{it.variantLabel}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-ink/40">Placed {fmtDateTime(result.placedAt)}</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-xs text-ink/40 mt-8 flex items-center justify-center gap-1.5">
        <Truck size={13} className="text-accent" />
        Prints dispatch in 24–48 h · Delivered in 4–7 days across India
      </p>
    </div>
  );
}
