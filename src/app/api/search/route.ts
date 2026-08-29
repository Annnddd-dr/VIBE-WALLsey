import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { artist: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
      ],
    },
    include: PRODUCT_CARD_INCLUDE,
    take: 8,
  });

  const results = products.map((p) => {
    const card = toCardData(p);
    return { slug: card.slug, title: card.title, image: card.images[0]?.url ?? null, price: card.minPrice };
  });

  return NextResponse.json({ results });
}
