import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatINR } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as any).id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  if (orders.length === 0) {
    return <EmptyState title="No orders yet" description="Your orders will show up here." ctaLabel="Start shopping" ctaHref="/shop" />;
  }

  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="text-3xl font-display mt-2 mb-8">Your orders</h1>
      <div className="space-y-4">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/account/orders/${o.id}`}
            className="block border border-line rounded-sm p-5 hover:border-ink/40 transition-colors bg-surface group"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm text-ink group-hover:text-accent transition-colors">
                  {o.orderNumber}
                </p>
                <p className="text-xs text-ink/50 mt-1">
                  {format(o.createdAt, 'dd MMM yyyy')} · {o.items.length} item(s)
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide bg-line px-2 py-1 rounded-sm">
                {o.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-line/60">
              <p className="text-sm font-semibold text-ink">{formatINR(o.total)}</p>
              <span className="text-xs text-accent flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                Tracking & Details <ChevronRight size={13} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
