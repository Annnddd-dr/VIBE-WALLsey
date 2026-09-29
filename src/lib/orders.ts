import { prisma } from '@/lib/prisma';
import { priceCart } from '@/lib/pricing';
import { createRazorpayOrder, verifyCheckoutSignature } from '@/lib/razorpay';
import { generateOrderNumber } from '@/lib/utils';
import { PaymentStatus } from '@prisma/client';

interface AddressInput {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

/**
 * Full authoritative checkout flow, per the "never trust the client" rule:
 * 1. Re-fetch cart lines from DB
 * 2. Re-price server-side (products, coupon, shipping)
 * 3. Create a PENDING order snapshotting those authoritative numbers
 * 4. Create a Razorpay order for that exact amount (or, for COD, commit immediately)
 * Inventory is deducted only on confirmed payment / COD commit — never before.
 */
export async function createPendingOrder(params: {
  userId: string | null;
  email: string;
  phone: string;
  address: AddressInput;
  cartLines: { variantId: string; quantity: number }[];
  couponCode?: string;
  paymentMethod?: 'online' | 'cod';
}) {
  const priced = await priceCart(params.cartLines, {
    couponCode: params.couponCode,
    userId: params.userId ?? undefined,
  });

  // Always snapshot the shipping address as its own Address row. For logged-in
  // users it links to their address book; for guests it stands alone so order
  // tracking, invoices and the admin order page still show the full address.
  const address = await prisma.address.create({
    data: {
      ...params.address,
      ...(params.userId ? { userId: params.userId } : {}),
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: params.userId ?? undefined,
      addressId: address?.id,
      email: params.email,
      phone: params.phone,
      status: 'PAYMENT_PENDING',
      subtotal: priced.subtotal,
      discountTotal: priced.discountTotal,
      shippingTotal: priced.shippingTotal,
      taxTotal: priced.taxTotal,
      total: priced.total,
      couponId: priced.appliedCoupon?.id,
      items: {
        create: priced.lines.map((l) => ({
          variantId: l.variantId,
          productTitle: l.productTitle,
          variantLabel: l.variantLabel,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.lineTotal,
        })),
      },
    },
    include: { items: true },
  });

  if (params.paymentMethod === 'cod') {
    const confirmed = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
        if (!inv || inv.stock - inv.reserved < item.quantity) {
          throw new Error(`Insufficient stock for "${item.productTitle}".`);
        }
        await tx.inventory.update({ where: { variantId: item.variantId }, data: { stock: { decrement: item.quantity } } });
      }
      const updated = await tx.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } });
      if (params.userId) {
        const cart = await tx.cart.findUnique({ where: { userId: params.userId } });
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
      return updated;
    });
    return { order: confirmed, razorpayOrder: null as any, codConfirmed: true };
  }

  const rpOrder = await createRazorpayOrder(order.total, order.orderNumber);

  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rpOrder.id } });

  await prisma.payment.create({
    data: { orderId: order.id, razorpayOrderId: rpOrder.id, amount: order.total, status: PaymentStatus.CREATED },
  });

  return { order, razorpayOrder: rpOrder, codConfirmed: false };
}

/**
 * Called from the client-side Razorpay checkout success handler.
 * Verifies the HMAC signature server-side, then atomically marks the order
 * PAID, marks the payment CAPTURED, and decrements inventory. Idempotent
 * against the webhook arriving before/after this call.
 */
export async function confirmPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const valid = verifyCheckoutSignature(params);
  if (!valid) throw new Error('Payment signature verification failed.');

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
      include: { items: true },
    });
    if (!order) throw new Error('Order not found for this payment.');

    if (order.status === 'PAID' || order.status === 'PROCESSING') {
      return order;
    }

    for (const item of order.items) {
      const inv = await tx.inventory.findUnique({ where: { variantId: item.variantId } });
      if (!inv || inv.stock - inv.reserved < item.quantity) {
        await tx.order.update({ where: { id: order.id }, data: { status: 'PROCESSING' } });
        throw new Error(
          `Insufficient stock to fulfil "${item.productTitle}" (${item.variantLabel}). Order flagged for manual review.`
        );
      }
      await tx.inventory.update({ where: { variantId: item.variantId }, data: { stock: { decrement: item.quantity } } });
    }

    await tx.payment.update({
      where: { orderId: order.id },
      data: { status: PaymentStatus.CAPTURED, razorpayPaymentId: params.razorpayPaymentId },
    });

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: 'PAID', razorpayPaymentId: params.razorpayPaymentId, razorpaySignature: params.razorpaySignature },
    });

    if (order.couponId && order.userId) {
      await tx.couponUsage.create({ data: { couponId: order.couponId, userId: order.userId } });
    }

    if (order.userId) {
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return updated;
  });
}
