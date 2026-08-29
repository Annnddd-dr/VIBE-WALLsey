import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];

  if (ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [{ id: { in: ids } }, { slug: { in: ids } }],
      status: 'ACTIVE',
    },
    include: PRODUCT_CARD_INCLUDE,
  });

  return NextResponse.json({
    products: products.map(toCardData),
  });
}
