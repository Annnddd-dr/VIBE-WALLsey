import { prisma } from '@/lib/prisma';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ShopFilters } from './ShopFilters';
import { ViewMoreButton } from './ViewMoreButton';
import { Prisma } from '@prisma/client';

export const metadata = { title: 'Shop All Posters' };

const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  featured: { featured: 'desc' },
  newest: { createdAt: 'desc' },
  bestselling: { bestSeller: 'desc' },
  rating: { ratingAvg: 'desc' },
};

interface Props {
  searchParams: { category?: string; sort?: string; size?: string; material?: string; frame?: string; q?: string; page?: string };
}

const PER_PAGE = 25;

export default async function ShopPage({ searchParams }: Props) {
  // Cumulative pagination: page 2 shows products 1–50, page 3 shows 1–75, etc.
  // The "View more" button appends the next batch below what's already visible.
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const take = page * PER_PAGE;

  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    ...(searchParams.category ? { category: { slug: searchParams.category } } : {}),
    ...(searchParams.q ? { title: { contains: searchParams.q, mode: 'insensitive' as const } } : {}),
    ...(searchParams.size
      ? {
          variants: {
            some: {
              isActive: true,
              ...(searchParams.size ? { size: searchParams.size as any } : {}),
            },
          },
        }
      : {}),
  };

  const orderBy = SORTS[searchParams.sort ?? 'featured'] ?? SORTS.featured;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({ where, include: PRODUCT_CARD_INCLUDE, orderBy, take }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const shown = products.length;
  const remaining = total - shown;

  function paramsWith(nextPage: number): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== 'page') params.set(k, v);
    }
    params.set('page', String(nextPage));
    return `/shop?${params.toString()}`;
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mb-8">
        <p className="eyebrow">Shop</p>
        <h1 className="text-3xl lg:text-4xl mt-2">All Posters</h1>
        <p className="text-ink/50 text-sm mt-2">
          Showing {shown} of {total} posters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
        <ShopFilters categories={categories} activeParams={searchParams} />

        <div>
          <ProductGrid products={products.map(toCardData)} />

          {remaining > 0 && (
            <div className="flex flex-col items-center gap-2 mt-14">
              <ViewMoreButton href={paramsWith(page + 1)} remaining={remaining} />
              <p className="text-xs text-ink/40">
                {shown}–{Math.min(total, shown + PER_PAGE)} of {total}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
