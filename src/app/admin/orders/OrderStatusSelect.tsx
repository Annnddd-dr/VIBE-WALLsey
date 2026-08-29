'use client';

import { useState, useTransition } from 'react';

const STATUSES = [
  'PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'PRINTING', 'PACKED',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED',
];

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  async function updateStatus(next: string) {
    setValue(next);
    startTransition(async () => {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    });
  }

  return (
    <select value={value} disabled={pending} onChange={(e) => updateStatus(e.target.value)} className="text-xs border border-line rounded-sm px-2 py-1 bg-white">
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
      ))}
    </select>
  );
}
