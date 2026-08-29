import { prisma } from '@/lib/prisma';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { RoleSelect } from './RoleSelect';
import { CustomerSearch } from './CustomerSearch';
import { Users, Mail, Phone, ShoppingCart } from 'lucide-react';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string };
}) {
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;
  const currentUserRole = (session?.user as any)?.role;
  const canManageRoles = hasRole(currentUserRole, 'ADMIN');

  const { q, role } = searchParams;
  const where: any = {};

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (role && role !== 'ALL') {
    where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      _count: { select: { orders: true, reviews: true } },
      orders: {
        where: { status: { notIn: ['CANCELLED', 'PAYMENT_PENDING'] } },
        select: { total: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display">Customers & Users</h1>
          <p className="text-xs text-ink/40 mt-1">{users.length} registered accounts</p>
        </div>
      </div>

      <CustomerSearch />

      <div className="border border-line rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-line/30 text-ink/60 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-right px-4 py-3">Orders</th>
              <th className="text-right px-4 py-3">Total Spent</th>
              <th className="text-left px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const totalSpent = u.orders.reduce((sum, o) => sum + o.total, 0);

              return (
                <tr key={u.id} className="border-t border-line hover:bg-line/10 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-line flex items-center justify-center text-xs font-semibold text-ink/70">
                        {u.name ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div>{u.name || 'Unnamed Customer'}</div>
                        <div className="text-xs text-ink/40 font-normal">ID: {u.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/60">
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-ink/40" />
                      {u.email}
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone size={12} className="text-ink/40" />
                        {u.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canManageRoles && u.id !== currentUserId ? (
                      <RoleSelect userId={u.id} currentRole={u.role} />
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-sm bg-line text-ink/70">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="text-ink/80 font-medium">{u._count.orders}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-ink">
                    {formatINR(totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/50">
                    {format(new Date(u.createdAt), 'dd MMM yyyy')}
                  </td>
                </tr>
              );
            })}

            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ink/30">
                  No customers matched your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
