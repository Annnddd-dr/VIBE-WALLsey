import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';
import { OrderStatusSelect } from './OrderStatusSelect';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true }, take: 100 });

  return (
    <div>
      <h1 className="text-2xl font-display mb-8">Orders</h1>
      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr><th className="text-left px-4 py-3">Order</th><th className="text-left px-4 py-3">Date</th><th className="text-left px-4 py-3">Customer</th><th className="text-left px-4 py-3">Total</th><th className="text-left px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="px-4 py-3">{o.orderNumber}</td>
                <td className="px-4 py-3">{format(o.createdAt, 'dd MMM yyyy')}</td>
                <td className="px-4 py-3">{o.email}</td>
                <td className="px-4 py-3">{formatINR(o.total)}</td>
                <td className="px-4 py-3"><OrderStatusSelect orderId={o.id} status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
