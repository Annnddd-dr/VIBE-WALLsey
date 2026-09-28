import { PosterSize } from '@prisma/client';

export const SIZE_LABELS: Record<PosterSize, { label: string; dims: string }> = {
  A6: { label: 'A6', dims: '105 × 148 mm' },
  A5: { label: 'A5', dims: '148 × 210 mm' },
  A4: { label: 'A4', dims: '210 × 297 mm' },
  A3: { label: 'A3', dims: '297 × 420 mm' },
  POLAROID: { label: 'Polaroid', dims: 'Square print with classic white border' },
};

/**
 * Official price sheet (paise) — one finish per size, premium matte, unframed:
 *   Polaroid ₹10 · A6 ₹15 · A5 ₹30 · A4 ₹40 · A3 ₹60
 */
export const SIZE_BASE_PRICE: Record<PosterSize, number> = {
  POLAROID: 1000,
  A6: 1500,
  A5: 3000,
  A4: 4000,
  A3: 6000,
};

export interface CartSummaryDTO {
  lines: {
    variantId: string;
    productTitle: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  appliedCoupon: { code: string } | null;
}
