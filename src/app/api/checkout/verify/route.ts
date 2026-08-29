import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/orders';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { formatINR } from '@/lib/utils';

const Schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payment payload.' }, { status: 400 });

  try {
    const order = await confirmPayment({
      razorpayOrderId: parsed.data.razorpay_order_id,
      razorpayPaymentId: parsed.data.razorpay_payment_id,
      razorpaySignature: parsed.data.razorpay_signature,
    });

    const full = await prisma.order.findUnique({ where: { id: order.id } });
    if (full) {
      sendOrderConfirmationEmail(full.email, full.orderNumber, formatINR(full.total)).catch(() => {});
    }

    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  } catch (err: any) {
    console.error('Payment verification failed:', err);
    return NextResponse.json({ error: err.message ?? 'Payment verification failed.' }, { status: 400 });
  }
}
