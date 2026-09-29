'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { CustomDesignStatus } from '@prisma/client';

const STATUSES: { value: CustomDesignStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'REVIEWING', label: 'Reviewing' },
  { value: 'QUOTED', label: 'Quoted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function RequestStatusControl({ id, initialStatus }: { id: string; initialStatus: CustomDesignStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function updateStatus(nextStatus: CustomDesignStatus) {
    const previous = status;
    setStatus(nextStatus);
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/custom-design/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? 'Update failed.');
      }
    } catch (updateError) {
      setStatus(previous);
      setError(updateError instanceof Error ? updateError.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="sr-only" htmlFor={`request-status-${id}`}>Request status</label>
      <div className="flex items-center gap-2">
        <select
          id={`request-status-${id}`}
          value={status}
          disabled={busy}
          onChange={(event) => updateStatus(event.target.value as CustomDesignStatus)}
          className="input-field min-w-32 py-2 text-xs"
        >
          {STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {busy && <LoaderCircle size={14} className="animate-spin text-ink/40" aria-label="Saving status" />}
      </div>
      {error && <p className="mt-1 max-w-40 text-[10px] text-red-700" role="alert">{error}</p>}
    </div>
  );
}