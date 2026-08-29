import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const roleFilter = searchParams.get('role');

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (roleFilter && roleFilter !== 'ALL') {
    where.role = roleFilter;
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

  const formatted = users.map((u) => {
    const totalSpent = u.orders.reduce((sum, o) => sum + o.total, 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      orderCount: u._count.orders,
      reviewCount: u._count.reviews,
      totalSpent,
    };
  });

  return NextResponse.json(formatted);
}
