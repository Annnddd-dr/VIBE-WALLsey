import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function AccountOverview() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;
  const [user, orderCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.order.count({ where: { userId } }),
  ]);

  return (
    <div>
      <p className="eyebrow">Account</p>
      <h1 className="text-3xl font-display mt-2 mb-8">Hi, {user?.name?.split(' ')[0] ?? 'there'}.</h1>
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="border border-line rounded-sm p-5">
          <p className="text-2xl font-medium">{orderCount}</p>
          <p className="text-xs text-ink/50 mt-1">Total orders</p>
        </div>
      </div>
    </div>
  );
}
