import { prisma } from '@/lib/prisma';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) return {};
  return {
    title: category.seoTitle ?? `${category.name} Posters`,
    description: category.seoDesc ?? category.description ?? `Shop premium ${category.name} posters at POSTERraxx.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', categoryId: category.id },
    include: PRODUCT_CARD_INCLUDE,
    orderBy: { featured: 'desc' },
  });

  return (
    <div>
      <section className="bg-charcoal text-paper py-20">
        <div className="container-page">
          <p className="eyebrow text-paper/70">Collection</p>
          <h1 className="text-4xl lg:text-5xl mt-3">{category.name} Posters</h1>
          {category.description && <p className="mt-4 text-paper/70 max-w-lg">{category.description}</p>}
        </div>
      </section>
      <div className="container-page py-14">
        <p className="text-ink/50 text-sm mb-8">{products.length} products</p>
        <ProductGrid products={products.map(toCardData)} />
      </div>
    </div>
  );
}
