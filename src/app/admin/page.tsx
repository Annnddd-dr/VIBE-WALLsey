import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { startOfDay } from 'date-fns';

export default async function AdminDashboard() {
  const today = startOfDay(new Date());

  const [todayOrders, allPaidOrders, orderCount, customerCount, pendingOrders, lowStock] = await Promise.all([
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' }, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { status: { notIn: ['PENDING', 'PAYMENT_PENDING', 'CANCELLED'] } }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
    prisma.inventory.count({ where: { stock: { lte: 5 } } }),
  ]);

  const recentOrders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { items: true } });

  const stats = [
    { label: "Today's Revenue", value: formatINR(todayOrders._sum.total ?? 0) },
    { label: 'Total Revenue', value: formatINR(allPaidOrders._sum.total ?? 0) },
    { label: 'Total Orders', value: orderCount },
    { label: 'Customers', value: customerCount },
    { label: 'Pending Fulfilment', value: pendingOrders },
    { label: 'Low Stock Variants', value: lowStock },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="border border-line rounded-sm p-5">
            <p className="text-2xl font-medium">{s.value}</p>
            <p className="text-xs text-ink/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-medium mb-4">Recent orders</h2>
      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr><th className="text-left px-4 py-3">Order</th><th className="text-left px-4 py-3">Items</th><th className="text-left px-4 py-3">Total</th><th className="text-left px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id} className="border-t border-line">
                <td className="px-4 py-3">{o.orderNumber}</td>
                <td className="px-4 py-3">{o.items.length}</td>
                <td className="px-4 py-3">{formatINR(o.total)}</td>
                <td className="px-4 py-3"><span className="text-xs bg-line px-2 py-1 rounded-sm">{o.status.replace(/_/g, ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
