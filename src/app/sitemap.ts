import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  return [
    { url: site, lastModified: new Date() },
    { url: `${site}/shop`, lastModified: new Date() },
    { url: `${site}/collections`, lastModified: new Date() },
    ...categories.map((c) => ({ url: `${site}/collections/${c.slug}`, lastModified: new Date() })),
    ...products.map((p) => ({ url: `${site}/product/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
