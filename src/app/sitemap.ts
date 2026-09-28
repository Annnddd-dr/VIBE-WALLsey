import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: site, lastModified: new Date() },
    { url: `${site}/shop`, lastModified: new Date() },
    { url: `${site}/track-order`, lastModified: new Date() },
    ...products.map((p) => ({ url: `${site}/product/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
