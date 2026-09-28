import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Schema = z.object({
  orderNumber: z.string().min(4).max(40),
  contact: z.string().min(5).max(120),
});

const TIMELINE = [
  { key: 'ORDER_PLACED', label: 'Order Placed' },
  { key: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
  { key: 'PRINTING', label: 'Printing' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const;

// Map order status → timeline stage index (-1 = cancelled/refunded).
const STATUS_TO_STAGE: Record<string, number> = {
  PENDING: 0,
  PAYMENT_PENDING: 0,
  PAID: 1,
  PROCESSING: 2,
  PRINTING: 2,
  PACKED: 3,
  SHIPPED: 4,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
  REFUNDED: -1,
  RETURN_REQUESTED: -1,
  RETURNED: -1,
};

function normalizeOrderNumber(input: string): string {
  return input.trim().toUpperCase();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter your order number and the email or mobile used at checkout.' }, { status: 400 });
  }

  const orderNumber = normalizeOrderNumber(parsed.data.orderNumber);
  const contact = parsed.data.contact.trim().toLowerCase();

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ orderNumber }, { id: parsed.data.orderNumber.trim() }],
    },
    include: {
      items: { select: { productTitle: true, variantLabel: true, quantity: true } },
      shipment: { select: { provider: true, trackingNumber: true, trackingUrl: true, status: true } },
      address: { select: { line1: true, city: true, state: true, pincode: true } },
    },
  });

  // Same generic error for "not found" and "bad contact" — no account enumeration.
  if (!order) {
    return NextResponse.json({ error: 'We could not find that order. Check the number and try again.' }, { status: 404 });
  }
  const emailMatch = order.email.toLowerCase() === contact;
  const phoneMatch = order.phone.replace(/\D/g, '').slice(-10) === contact.replace(/\D/g, '').slice(-10);
  if (!emailMatch && !phoneMatch) {
    return NextResponse.json({ error: 'We could not find that order. Check the number and try again.' }, { status: 404 });
  }

  const stage = STATUS_TO_STAGE[order.status] ?? 0;
  const cancelled = stage === -1;

  const steps = TIMELINE.map((s, i) => ({
    key: s.key,
    label: s.label,
    state: cancelled ? 'inactive' : i < stage ? 'completed' : i === stage ? 'active' : 'upcoming',
  }));

  const placedAt = order.createdAt;
  const eta = new Date(placedAt);
  eta.setDate(eta.getDate() + 6);

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.createdAt,
    estimatedDelivery: eta,
    cancelled,
    items: order.items,
    shipment: order.shipment,
    destination: order.address
      ? { city: order.address.city, state: order.address.state, pincode: order.address.pincode }
      : null,
    steps,
  });
}
