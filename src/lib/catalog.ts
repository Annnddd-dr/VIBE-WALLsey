import { ProductCardData } from '@/components/product/ProductCard';

/** Shape a Product (with variants/images loaded) into the flat card DTO the UI expects. */
export function toCardData(product: any): ProductCardData {
  const activeVariants = (product.variants ?? []).filter((v: any) => v.isActive);
  const minVariant = activeVariants.reduce((min: any, v: any) => (!min || v.price < min.price ? v : min), null);

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    images: product.images ?? [],
    minPrice: minVariant?.price ?? 0,
    compareAtPrice: minVariant?.compareAtPrice ?? null,
    ratingAvg: product.ratingAvg ?? 0,
    ratingCount: product.ratingCount ?? 0,
    bestSeller: product.bestSeller,
    newArrival: product.newArrival,
    defaultVariantId: minVariant?.id,
  };
}

export const PRODUCT_CARD_INCLUDE = {
  images: { orderBy: { position: 'asc' as const }, take: 2 },
  variants: { where: { isActive: true }, include: { inventory: true } },
};
