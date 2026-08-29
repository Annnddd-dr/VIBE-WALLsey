import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';

/**
 * Server-to-server source of truth for payment state. Configure this URL
 * in the Razorpay dashboard with RAZORPAY_WEBHOOK_SECRET. Idempotent against
 * retried/duplicate webhook deliveries.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  try {
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
      if (order && order.status !== 'PAID') {
        await prisma.$transaction(async (tx) => {
          const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
          for (const item of items) {
            const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
            if (inv && inv.stock >= item.quantity) {
              await tx.inventory.update({ where: { variantId: item.variantId }, data: { stock: { decrement: item.quantity } } });
            }
          }
          await tx.order.update({ where: { id: order.id }, data: { status: 'PAID', razorpayPaymentId: payment.id } });
          await tx.payment.update({ where: { orderId: order.id }, data: { status: 'CAPTURED', razorpayPaymentId: payment.id } });
        });
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const order = await prisma.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
      if (order && order.status === 'PAYMENT_PENDING') {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
        await prisma.payment.update({ where: { orderId: order.id }, data: { status: 'FAILED' } });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
