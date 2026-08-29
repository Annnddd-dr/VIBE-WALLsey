import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';
import { CouponFormModal } from './CouponFormModal';
import { CouponRowActions } from './CouponRowActions';
import { Tag } from 'lucide-react';

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    include: {
      _count: { select: { orders: true, usages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display">Coupons</h1>
          <p className="text-xs text-ink/40 mt-1">{coupons.length} coupons configured</p>
        </div>
        <CouponFormModal />
      </div>

      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Discount</th>
              <th className="text-left px-4 py-3">Conditions</th>
              <th className="text-right px-4 py-3">Usages</th>
              <th className="text-left px-4 py-3">Expires</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => {
              const discountText =
                c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `${formatINR(c.value)} OFF`;

              const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;

              return (
                <tr key={c.id} className="border-t border-line hover:bg-line/10 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-ink flex items-center gap-2">
                    <Tag size={13} className="text-accent" />
                    {c.code}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">{discountText}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/60">
                    <div>
                      {c.minOrderAmount > 0 ? `Min. ${formatINR(c.minOrderAmount)}` : 'No min.'}
                    </div>
                    {c.firstOrderOnly && (
                      <span className="inline-block mt-0.5 text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-sm">
                        First order only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink/70">
                    {c._count.usages} {c.maxUsage ? `/ ${c.maxUsage}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.expiresAt ? (
                      <span className={isExpired ? 'text-red-500 font-medium' : 'text-ink/60'}>
                        {format(new Date(c.expiresAt), 'dd MMM yyyy')}
                        {isExpired && ' (Expired)'}
                      </span>
                    ) : (
                      <span className="text-ink/30">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CouponRowActions couponId={c.id} isActive={c.isActive} />
                  </td>
                </tr>
              );
            })}

            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink/30">
                  No coupons found. Create your first coupon using the button above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
