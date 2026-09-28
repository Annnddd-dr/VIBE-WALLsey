'use client';

import { useState } from 'react';
import { AddressData, AddressFormModal } from './AddressFormModal';
import { MapPin, Phone, Pencil, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AddressCard({ address }: { address: AddressData & { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const makeDefault = async () => {
    setLoading(true);
    try {
      await fetch(`/api/addresses/${address.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      router.refresh();
    } catch {
      alert('Failed to set as default address.');
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async () => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setLoading(true);
    try {
      await fetch(`/api/addresses/${address.id}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch {
      alert('Failed to delete address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`border rounded-sm p-5 relative transition-all bg-surface ${
        address.isDefault ? 'border-ink ring-1 ring-ink/10' : 'border-line'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-accent" />
          <h3 className="text-sm font-semibold text-ink">{address.name}</h3>
        </div>
        {address.isDefault && (
          <span className="text-[10px] uppercase tracking-wider font-semibold bg-ink text-paper px-2 py-0.5 rounded-sm flex items-center gap-1">
            <CheckCircle2 size={11} /> Default
          </span>
        )}
      </div>

      <p className="text-xs text-ink/70 leading-relaxed">
        {address.line1}
        {address.line2 && <>, {address.line2}</>}
      </p>
      <p className="text-xs text-ink/70 mt-0.5">
        {address.city}, {address.state} - <span className="font-mono">{address.pincode}</span>
      </p>

      <p className="text-xs text-ink/50 mt-3 flex items-center gap-1.5">
        <Phone size={12} />
        {address.phone}
      </p>

      <div className="flex items-center justify-between pt-4 mt-4 border-t border-line text-xs">
        <div>
          {!address.isDefault && (
            <button
              onClick={makeDefault}
              disabled={loading}
              className="text-ink/60 hover:text-accent font-medium transition-colors"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : 'Set as default'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <AddressFormModal
            initialData={address}
            triggerButton={
              <button
                type="button"
                className="text-ink/50 hover:text-ink flex items-center gap-1 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
            }
          />
          <button
            onClick={deleteAddress}
            disabled={loading}
            className="text-ink/40 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
