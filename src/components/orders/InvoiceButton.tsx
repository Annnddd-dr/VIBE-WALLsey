'use client';

import { FileText, Printer } from 'lucide-react';

export function InvoiceButton({ orderId }: { orderId: string }) {
  const handleOpenInvoice = () => {
    window.open(`/api/orders/${orderId}/invoice`, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleOpenInvoice}
      className="btn btn-ghost text-xs gap-1.5 py-2 px-3 inline-flex items-center hover:border-ink"
      title="View and print official GST Tax Invoice"
    >
      <Printer size={13} className="text-accent" />
      <span>Print GST Invoice</span>
    </button>
  );
}
