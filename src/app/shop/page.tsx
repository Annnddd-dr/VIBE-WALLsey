import { prisma } from '@/lib/prisma';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ShopFilters } from './ShopFilters';
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

export default async function ShopPage({ searchParams }: Props) {
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const perPage = 24;

  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    ...(searchParams.category ? { category: { slug: searchParams.category } } : {}),
    ...(searchParams.q ? { title: { contains: searchParams.q, mode: 'insensitive' as const } } : {}),
    ...(searchParams.size || searchParams.material || searchParams.frame
      ? {
          variants: {
            some: {
              isActive: true,
              ...(searchParams.size ? { size: searchParams.size as any } : {}),
              ...(searchParams.material ? { material: searchParams.material as any } : {}),
              ...(searchParams.frame ? { frame: searchParams.frame as any } : {}),
            },
          },
        }
      : {}),
  };

  const orderBy = SORTS[searchParams.sort ?? 'featured'] ?? SORTS.featured;

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({ where, include: PRODUCT_CARD_INCLUDE, orderBy, skip: (page - 1) * perPage, take: perPage }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mb-8">
        <p className="eyebrow">Shop</p>
        <h1 className="text-3xl lg:text-4xl mt-2">All Posters</h1>
        <p className="text-ink/50 text-sm mt-2">{total} products</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
        <ShopFilters categories={categories} activeParams={searchParams} />

        <div>
          <ProductGrid products={products.map(toCardData)} />

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-14">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const params = new URLSearchParams(searchParams as any);
                params.set('page', String(p));
                return (
                  <a
                    key={p}
                    href={`/shop?${params.toString()}`}
                    className={`w-9 h-9 flex items-center justify-center text-sm border rounded-sm ${
                      p === page ? 'border-ink bg-ink text-paper' : 'border-line hover:border-ink'
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
