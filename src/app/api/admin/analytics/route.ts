import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subDays, startOfDay, format } from 'date-fns';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const thirtyDaysAgo = subDays(startOfDay(new Date()), 29);

  // 1. Fetch orders from last 30 days
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      status: { notIn: ['CANCELLED', 'PAYMENT_PENDING'] },
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // 2. Generate 30 daily buckets
  const dailyMap: Record<string, { date: string; label: string; revenue: number; orders: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, 'yyyy-MM-dd');
    dailyMap[key] = {
      date: key,
      label: format(d, 'dd MMM'),
      revenue: 0,
      orders: 0,
    };
  }

  let totalRevenue = 0;
  const productSalesMap: Record<string, { title: string; units: number; revenue: number; category: string }> = {};
  const categoryRevenueMap: Record<string, { name: string; revenue: number }> = {};

  orders.forEach((o) => {
    const key = format(new Date(o.createdAt), 'yyyy-MM-dd');
    if (dailyMap[key]) {
      dailyMap[key].revenue += o.total;
      dailyMap[key].orders += 1;
    }
    totalRevenue += o.total;

    o.items.forEach((item) => {
      const prodTitle = item.productTitle;
      const catName = item.variant?.product?.category?.name || 'General';

      if (!productSalesMap[prodTitle]) {
        productSalesMap[prodTitle] = { title: prodTitle, units: 0, revenue: 0, category: catName };
      }
      productSalesMap[prodTitle].units += item.quantity;
      productSalesMap[prodTitle].revenue += item.lineTotal;

      if (!categoryRevenueMap[catName]) {
        categoryRevenueMap[catName] = { name: catName, revenue: 0 };
      }
      categoryRevenueMap[catName].revenue += item.lineTotal;
    });
  });

  const timeline = Object.values(dailyMap);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Top products
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Category shares
  const categories = Object.values(categoryRevenueMap)
    .sort((a, b) => b.revenue - a.revenue);

  // Repeat customer rate
  const customerOrderCounts = await prisma.order.groupBy({
    by: ['email'],
    where: { status: { notIn: ['CANCELLED', 'PAYMENT_PENDING'] } },
    _count: { id: true },
  });

  const repeatCustomers = customerOrderCounts.filter((c) => c._count.id > 1).length;
  const totalUniqueCustomers = customerOrderCounts.length;
  const repeatRate = totalUniqueCustomers > 0 ? Math.round((repeatCustomers / totalUniqueCustomers) * 100) : 0;

  return NextResponse.json({
    metrics: {
      totalRevenue,
      totalOrders,
      aov,
      repeatRate,
      uniqueCustomers: totalUniqueCustomers,
    },
    timeline,
    topProducts,
    categories,
  });
}
