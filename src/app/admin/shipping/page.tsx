import { prisma } from '@/lib/prisma';
import { AdminShippingClient } from './AdminShippingClient';

export const metadata = { title: 'Shipping — VIBEWALLseyy Admin' };

export default async function AdminShippingPage() {
  const [shipments, recentOrders] = await Promise.all([
    prisma.shipment.findMany({
      orderBy: { shippedAt: { sort: 'desc', nulls: 'last' } },
      take: 30,
      include: {
        order: {
          select: { orderNumber: true, status: true },
        },
      },
    }),
    prisma.order.findMany({
      where: { shipment: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, orderNumber: true, status: true, createdAt: true },
    }),
  ]);

  return (
    <AdminShippingClient
      shipments={shipments.map((s) => ({
        id: s.id,
        orderId: s.orderId,
        orderNumber: s.order.orderNumber,
        orderStatus: s.order.status,
        provider: s.provider,
        trackingNumber: s.trackingNumber,
        status: s.status,
        shippedAt: s.shippedAt?.toISOString() ?? null,
        deliveredAt: s.deliveredAt?.toISOString() ?? null,
      }))}
      unshipped={recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
      }))}
      freeThreshold={Number(process.env.FREE_SHIPPING_THRESHOLD_INR ?? 500)}
      flatRate={Number(process.env.FLAT_SHIPPING_RATE_INR ?? 99)}
    />
  );
}
