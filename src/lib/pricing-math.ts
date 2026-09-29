export type DiscountInput = {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
};

export function computeDiscount(coupon: DiscountInput, subtotal: number): number {
  if (coupon.type === 'PERCENTAGE') {
    return Math.floor((subtotal * coupon.value) / 100);
  }
  return Math.min(coupon.value, subtotal);
}