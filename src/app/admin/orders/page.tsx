import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronRight as ViewIcon, SearchX } from 'lucide-react';
import { OrderListFilters } from './OrderListFilters';

const STATUSES = [
  'PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'PRINTING', 'PACKED',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED',
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  PAYMENT_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  PRINTING: 'bg-blue-50 text-blue-700 border-blue-200',
  PACKED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  OUT_FOR_DELIVERY: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-red-50 text-red-700 border-red-200',
  RETURN_REQUESTED: 'bg-rose-50 text-rose-700 border-rose-200',
  RETURNED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PAGE_SIZE = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);
  const { search, status } = searchParams;

  const where: any = {};
  if (status && STATUSES.includes(status as any)) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { user: { is: { name: { contains: search, mode: 'insensitive' } } } },
      {
        address: {
          is: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { pincode: { contains: search } },
            ],
          },
        },
      },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        items: true,
        address: { select: { name: true, city: true, state: true } },
        shipment: { select: { trackingNumber: true } },
        payment: { select: { status: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status && status !== 'ALL') params.set('status', status);
    if (newPage > 1) params.set('page', String(newPage));
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display">Orders</h1>
          <p className="text-xs text-ink/40 mt-1">{total} order(s)</p>
        </div>
      </div>

      <OrderListFilters />

      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Items</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-left px-4 py-3">Payment</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const color = STATUS_COLORS[o.status] ?? 'bg-line text-ink/50';
              return (
                <tr key={o.id} className="border-t border-line hover:bg-line/10 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/60">{format(o.createdAt, 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{o.address?.name ?? o.email}</p>
                    <p className="text-[11px] text-ink/40">
                      {o.address ? `${o.address.city}, ${o.address.state}` : o.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {o.items.reduce((n, i) => n + i.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-ink/50">
                      {o.payment?.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-sm border ${color}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-accent transition-colors p-1.5"
                      title="View order"
                    >
                      <ViewIcon size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <SearchX className="mx-auto mb-2 text-ink/20" size={24} />
                  <p className="text-ink/40 text-sm">No orders found.</p>
                  {search && (
                    <p className="text-ink/30 text-xs mt-1">Try a different search or clear filters.</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 text-xs text-ink/60">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildHref(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-line rounded-sm hover:border-ink/40 transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-line rounded-sm hover:border-ink/40 transition-colors"
              >
                Next <ChevronRight size={13} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}