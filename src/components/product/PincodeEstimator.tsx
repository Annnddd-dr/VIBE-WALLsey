'use client';

import { useState, useEffect, useCallback } from 'react';
import { Truck, CheckCircle2, AlertCircle, Loader2, MapPin } from 'lucide-react';
import { ShippingEstimateResult } from '@/lib/shipping';

const STORAGE_KEY = 'vibewallsey_pincode';

export function PincodeEstimator() {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<ShippingEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize checkPincode to prevent re-creation on every render
  const checkPincode = useCallback(async (codeToCheck?: string) => {
    const pin = (codeToCheck || pincode).trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setError('Enter a valid 6-digit PIN code');
      setResult(null);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/shipping/estimate?pincode=${pin}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Delivery estimate unavailable.');
      }

      setResult(json);
      try {
        localStorage.setItem(STORAGE_KEY, pin);
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Could not check delivery.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [pincode]);

  // Auto-load saved pincode
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && /^[1-9][0-9]{5}$/.test(saved)) {
        setPincode(saved);
        checkPincode(saved);
      }
    } catch {}
  }, [checkPincode]);

  return (
    <div className="border border-line rounded-sm p-4 bg-surface/70 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
        <Truck size={14} className="text-accent" />
        <span>Delivery & Courier Estimate</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit PIN code"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && checkPincode()}
            className="input text-xs pl-8 py-2 font-mono"
          />
        </div>
        <button
          type="button"
          onClick={() => checkPincode()}
          disabled={loading || pincode.length < 6}
          className="btn btn-primary text-xs py-2 px-4 whitespace-nowrap disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : 'Check'}
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {result && (
        <div className="pt-2 border-t border-line/60 space-y-1.5 text-xs animate-fade-in">
          <div className="flex items-baseline justify-between">
            <span className="text-ink/60">Estimated Delivery:</span>
            <strong className="text-emerald-700 font-medium">{result.deliveryRange}</strong>
          </div>
          <div className="flex items-baseline justify-between text-[11px] text-ink/50">
            <span>Delivering to:</span>
            <span className="text-ink/80 font-medium">
              {result.city}, {result.state}
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1 text-[11px] text-ink/60">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 size={11} /> COD Available
            </span>
            <span>·</span>
            <span>Free delivery on ₹{Math.round(result.freeShippingThreshold / 100)}+</span>
          </div>
        </div>
      )}
    </div>
  );
}
