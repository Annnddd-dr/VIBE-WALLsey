import { prisma } from '@/lib/prisma';
import { ProductForm } from '../../ProductForm';
import { notFound } from 'next/navigation';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { include: { inventory: true }, orderBy: { sku: 'asc' } },
        category: true,
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!product) notFound();

  return <ProductForm mode="edit" categories={categories} initialData={product} />;
}
