'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface AddressData {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export function AddressFormModal({
  initialData,
  triggerButton,
}: {
  initialData?: AddressData;
  triggerButton?: React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [line1, setLine1] = useState(initialData?.line1 || '');
  const [line2, setLine2] = useState(initialData?.line2 || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [pincode, setPincode] = useState(initialData?.pincode || '');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        name,
        phone,
        line1,
        line2: line2 || null,
        city,
        state,
        pincode,
        isDefault,
      };

      const url = isEdit ? `/api/addresses/${initialData!.id}` : '/api/addresses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save address.');

      setOpen(false);
      if (!isEdit) {
        setName('');
        setPhone('');
        setLine1('');
        setLine2('');
        setCity('');
        setState('');
        setPincode('');
        setIsDefault(false);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error saving address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setOpen(true)}>{triggerButton}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn btn-primary gap-2 text-xs"
        >
          <Plus size={14} />
          Add New Address
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-paper border border-line rounded-sm max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-ink/40 hover:text-ink"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-display mb-4">
              {isEdit ? 'Edit Address' : 'Add New Address'}
            </h2>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Recipient name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink/60 font-medium mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  required
                  placeholder="Flat, House no., Building, Apartment"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="block text-ink/60 font-medium mb-1">Address Line 2 (optional)</label>
                <input
                  type="text"
                  placeholder="Area, Street, Sector, Landmark"
                  value={line2 || ''}
                  onChange={(e) => setLine2(e.target.value)}
                  className="input text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-ink/60 font-medium mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City / Town"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-ink/60 font-medium mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-ink/60 font-medium mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 560001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="input text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded-sm border-line text-accent focus:ring-accent"
                />
                <label htmlFor="isDefault" className="text-ink/80 cursor-pointer">
                  Set as default delivery address
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
                  {loading ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
