import { describe, expect, it } from 'vitest';
import { computeDiscount } from './pricing-math';

describe('computeDiscount', () => {
  it('rounds percentage discounts down to whole paise', () => {
    expect(computeDiscount({ type: 'PERCENTAGE', value: 15 }, 999)).toBe(149);
  });

  it('caps fixed discounts at the subtotal', () => {
    expect(computeDiscount({ type: 'FIXED', value: 500 }, 300)).toBe(300);
  });

  it('applies fixed discounts below the subtotal', () => {
    expect(computeDiscount({ type: 'FIXED', value: 125 }, 300)).toBe(125);
  });
});