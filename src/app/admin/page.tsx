import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { startOfDay } from 'date-fns';

export default async function AdminDashboard() {
  const today = startOfDay(new Date());
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [todayOrders, allPaidOrders, orderCount, customerCount, pendingOrders, lowStock, weekOrders] = await Promise.all([
    prisma.order.aggregate({ where: { status: { not: 'CANCELLED' }, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { status: { notIn: ['PENDING', 'PAYMENT_PENDING', 'CANCELLED'] } }, _sum: { total: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
    prisma.inventory.count({ where: { stock: { lte: 5 } } }),
    prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { notIn: ['CANCELLED', 'PENDING', 'PAYMENT_PENDING'] } },
      select: { total: true, createdAt: true }
    })
  ]);

  const recentOrders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { items: true } });

  const stats = [
    { label: "Today's revenue", value: formatINR(todayOrders._sum.total ?? 0), delta: 'Live' },
    { label: 'Gross revenue', value: formatINR(allPaidOrders._sum.total ?? 0), delta: 'Live' },
    { label: 'Orders', value: orderCount, delta: 'Live' },
    { label: 'Customers', value: customerCount, delta: 'Live' },
  ];

  // Calculate real daily totals for the last 7 days
  const dailyTotals = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  weekOrders.forEach(o => {
    const diffDays = Math.floor((now.getTime() - o.createdAt.getTime()) / (1000 * 3600 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      dailyTotals[6 - diffDays] += (o.total / 100);
    }
  });
  const maxTotal = Math.max(...dailyTotals, 1);
  const channelBars = dailyTotals.map(val => Math.round((val / maxTotal) * 100));

  return (
    <div className="space-y-8">
      <section className="admin-hero rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(62,124,79,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.18)] lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-ink/50">Executive overview</p>
            <h2 className="mt-3 font-display text-4xl text-ink">Premium commerce control centre</h2>
          </div>

          <div className="flex gap-3">
            <button className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/15">
              Export report
            </button>
            <button className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:opacity-90">
              Launch campaign
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-card rounded-3xl p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-ink/45">
              <span>{stat.label}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-600">{stat.delta}</span>
            </div>
            <div className="mt-5 text-3xl font-semibold tracking-tight text-ink">{stat.value}</div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-gradient-to-r from-accent via-emerald-500 to-teal-400" style={{ width: '100%' }} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="admin-card rounded-[28px] p-5 lg:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-ink/45">Performance pulse</p>
              <h3 className="mt-2 font-display text-2xl text-ink">Revenue velocity</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-black/5 px-3 py-1 text-xs text-ink/60">Last 7 days</div>
          </div>

          <div className="flex h-52 items-end gap-3">
            {channelBars.map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center justify-end gap-2 group">
                <div className="w-full rounded-t-[18px] bg-gradient-to-t from-accent via-emerald-500 to-emerald-300 transition-all group-hover:opacity-80" style={{ height: `${Math.max(value, 2)}%` }} />
                <span className="text-[10px] uppercase tracking-[0.15em] text-ink/40">{['M','T','W','T','F','S','S'][index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card rounded-[28px] p-5 lg:p-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-ink/45">Operations</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Pending fulfilment</div>
              <div className="mt-2 text-3xl font-semibold text-ink">{pendingOrders}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Low stock alerts</div>
              <div className="mt-2 text-3xl font-semibold text-ink">{lowStock}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-ink/45">Avg. cart value</div>
              <div className="mt-2 text-3xl font-semibold text-ink">{formatINR((allPaidOrders._sum.total ?? 0) / Math.max(orderCount, 1))}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-card rounded-[28px] p-5 lg:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-ink/45">Recent orders</p>
            <h3 className="mt-2 font-display text-2xl text-ink">Order stream</h3>
          </div>
          <a href="/admin/orders" className="rounded-full border border-white/10 bg-black/5 px-4 py-1.5 text-xs text-ink/60 hover:bg-black/10 transition-colors">
            View all
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-[10px] uppercase tracking-[0.2em] text-ink/45">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink/50 italic">No recent orders found.</td>
                </tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-white/10 hover:bg-black/5 transition-colors">
                  <td className="px-4 py-3 text-ink font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-ink/65">{order.items.length}</td>
                  <td className="px-4 py-3 text-ink">{formatINR(order.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] font-medium ${
                      order.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' :
                      order.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-line/50 text-ink/70'
                    }`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
