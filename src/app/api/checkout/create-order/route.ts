import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCartLines } from '@/lib/cart';
import { createPendingOrder } from '@/lib/orders';
import { PricingError } from '@/lib/pricing';
import { z } from 'zod';

const Schema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  address: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(4).max(8),
  }),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['online', 'cod']).default('online'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please fill in all required fields.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { items } = await getCartLines(userId);
  if (items.length === 0) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });

  try {
    const { order, razorpayOrder, codConfirmed } = await createPendingOrder({
      userId,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      cartLines: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      couponCode: parsed.data.couponCode,
      paymentMethod: parsed.data.paymentMethod,
    });

    if (codConfirmed) {
      return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, amount: order.total, codConfirmed: true });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: order.total,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    if (err instanceof PricingError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('create-order failed:', err);
    return NextResponse.json({ error: err.message ?? 'Could not start checkout.' }, { status: 500 });
  }
}
