import { prisma } from '@/lib/prisma';
import { CategoriesClient } from './CategoriesClient';

export const metadata = { title: 'Categories — VIBEWALLseyy Admin' };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  return <CategoriesClient initialCategories={categories} />;
}
