import { prisma } from '@/lib/prisma';
import { ProductForm } from '../ProductForm';

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  return <ProductForm mode="create" categories={categories} />;
}
