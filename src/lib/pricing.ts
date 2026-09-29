import { prisma } from '@/lib/prisma';
import { getShippingRates } from '@/lib/store-settings';
import { Coupon, CouponType } from '@prisma/client';
import { computeDiscount } from '@/lib/pricing-math';

/**
 * SERVER-SIDE AUTHORITATIVE PRICING
 * Nothing about price, discount, shipping, or total is ever trusted from the client.
 * Every checkout call re-derives these numbers from the database.
 */

export interface PricedLine {
  variantId: string;
  productTitle: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PriceSummary {
  lines: PricedLine[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  appliedCoupon: Coupon | null;
  /** Free-shipping threshold in paise, resolved from admin settings. */
  freeShippingThreshold: number;
}

export class PricingError extends Error {}

export async function priceCart(
  requestedLines: { variantId: string; quantity: number }[],
  opts: { couponCode?: string; userId?: string } = {}
): Promise<PriceSummary> {
  if (requestedLines.length === 0) throw new PricingError('Cart is empty.');

  const variantIds = requestedLines.map((l) => l.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: { product: true, inventory: true },
  });

  const lines: PricedLine[] = [];
  let subtotal = 0;

  for (const req of requestedLines) {
    const variant = variants.find((v) => v.id === req.variantId);
    if (!variant) throw new PricingError(`Product variant unavailable: ${req.variantId}`);
    if (req.quantity < 1) throw new PricingError('Invalid quantity.');

    const available = (variant.inventory?.stock ?? 0) - (variant.inventory?.reserved ?? 0);
    if (available < req.quantity) {
      throw new PricingError(`Insufficient stock for ${variant.product.title} (${variant.size}).`);
    }

    const lineTotal = variant.price * req.quantity;
    subtotal += lineTotal;

    lines.push({
      variantId: variant.id,
      productTitle: variant.product.title,
      variantLabel: `${variant.size} · Archival Matte`,
      quantity: req.quantity,
      unitPrice: variant.price,
      lineTotal,
    });
  }

  let discountTotal = 0;
  let appliedCoupon: Coupon | null = null;

  if (opts.couponCode) {
    appliedCoupon = await validateCoupon(opts.couponCode, subtotal, opts.userId);
    discountTotal = computeDiscount(appliedCoupon, subtotal);
  }

  // Shipping config is admin-editable (DB-backed, env fallback) so changes in
  // Admin -> Shipping apply to the storefront immediately.
  const rates = await getShippingRates();
  const freeThresholdPaise = rates.freeShippingThreshold * 100;
  const flatRatePaise = rates.flatShippingRate * 100;

  const taxableAmount = subtotal - discountTotal;
  const shippingTotal = taxableAmount >= freeThresholdPaise ? 0 : flatRatePaise;
  const taxTotal = 0;
  const total = subtotal - discountTotal + shippingTotal + taxTotal;

  return {
    lines,
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    total,
    appliedCoupon,
    freeShippingThreshold: freeThresholdPaise,
  };
}

export async function validateCoupon(code: string, subtotal: number, userId?: string): Promise<Coupon> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

  if (!coupon || !coupon.isActive) throw new PricingError('Invalid or inactive coupon.');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new PricingError('This coupon has expired.');
  if (subtotal < coupon.minOrderAmount) {
    throw new PricingError(`Minimum order of ₹${coupon.minOrderAmount / 100} required for this coupon.`);
  }

  if (coupon.maxUsage) {
    const totalUses = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
    if (totalUses >= coupon.maxUsage) throw new PricingError('This coupon has reached its usage limit.');
  }

  if (userId) {
    const userUses = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (userUses >= coupon.perUserLimit) throw new PricingError('You have already used this coupon.');

    if (coupon.firstOrderOnly) {
      const priorOrders = await prisma.order.count({ where: { userId, status: { notIn: ['PENDING', 'CANCELLED'] } } });
      if (priorOrders > 0) throw new PricingError('This coupon is valid for first orders only.');
    }
  }

  return coupon;
}

