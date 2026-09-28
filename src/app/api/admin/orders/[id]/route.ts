import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendOrderStatusEmail } from '@/lib/email';

const STATUSES = [
  'PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'PRINTING', 'PACKED',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED',
] as const;

export type OrderStatus = (typeof STATUSES)[number];

const ORDER_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { position: 'asc' as const }, take: 1 } },
          },
        },
      },
    },
  },
  address: true,
  payment: true,
  shipment: true,
  coupon: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
};

// --- GET: fetch a single order with full detail for the admin detail page ---
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: ORDER_INCLUDE,
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json(order);
}

// --- PATCH: update order status and/or shipment tracking details ---
const StatusSchema = z.object({ status: z.enum(STATUSES) });

const ShipmentSchema = z.object({
  provider: z.string().trim().min(1).max(100).optional(),
  trackingNumber: z.string().trim().min(1).max(100).optional(),
  trackingUrl: z.string().trim().url().optional().or(z.literal('')),
});

const UpdateSchema = z.object({
  status: StatusSchema.shape.status.optional(),
  shipment: ShipmentSchema.optional(),
}).refine((d) => d.status !== undefined || d.shipment !== undefined, {
  message: 'Provide a status or shipment details.',
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, shipment } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const data: any = {};
  if (status) data.status = status;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Update order status when provided
      if (status) {
        await tx.order.update({ where: { id: params.id }, data: { status } });
        if (status === 'DELIVERED') {
          await tx.shipment.upsert({
            where: { orderId: params.id },
            update: { status: 'DELIVERED', deliveredAt: new Date() },
            create: { orderId: params.id, status: 'DELIVERED', deliveredAt: new Date() },
          });
        } else if (status === 'SHIPPED' || status === 'OUT_FOR_DELIVERY') {
          await tx.shipment.upsert({
            where: { orderId: params.id },
            update: { status, shippedAt: new Date() },
            create: { orderId: params.id, status, shippedAt: new Date() },
          });
        }
      }

      // Update shipment tracking details when provided
      if (shipment) {
        const patch: any = {};
        if (shipment.provider !== undefined) patch.provider = shipment.provider;
        if (shipment.trackingNumber !== undefined) patch.trackingNumber = shipment.trackingNumber;
        if (shipment.trackingUrl !== undefined) patch.trackingUrl = shipment.trackingUrl || null;

        if (Object.keys(patch).length > 0) {
          await tx.shipment.upsert({
            where: { orderId: params.id },
            update: patch,
            create: { orderId: params.id, ...patch, status: 'NOT_SHIPPED' },
          });
        }
      }

      return tx.order.findUnique({ where: { id: params.id }, include: ORDER_INCLUDE });
    });

    // Fire-and-forget status email (only on actual status change, not shipment-only edits)
    if (status && status !== order.status) {
      sendOrderStatusEmail(order.email, order.orderNumber, status.replace(/_/g, ' ')).catch(() => {});
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (err: any) {
    console.error('[admin/orders] Update error:', err);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}