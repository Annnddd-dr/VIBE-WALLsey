import { PosterSize, PosterMaterial, PosterFrame } from '@prisma/client';

export const SIZE_LABELS: Record<PosterSize, { label: string; dims: string }> = {
  A5: { label: 'A5', dims: '148 × 210 mm' },
  A4: { label: 'A4', dims: '210 × 297 mm' },
  A3: { label: 'A3', dims: '297 × 420 mm' },
  A2: { label: 'A2', dims: '420 × 594 mm' },
  A1: { label: 'A1', dims: '594 × 841 mm' },
};

export const MATERIAL_LABELS: Record<PosterMaterial, string> = {
  MATTE: 'Matte',
  GLOSSY: 'Glossy',
  TEXTURED: 'Textured',
};

export const FRAME_LABELS: Record<PosterFrame, string> = {
  NONE: 'No Frame',
  BLACK: 'Black Frame',
  WHITE: 'White Frame',
  WOOD: 'Wood Frame',
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
