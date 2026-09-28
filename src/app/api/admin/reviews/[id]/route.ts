import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReviewStatus } from '@prisma/client';

async function guard() {
  const session = await getServerSession(authOptions);
  return !!session?.user && hasRole((session?.user as any)?.role, 'STAFF');
}

async function recomputeRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: Number((agg._avg.rating ?? 0).toFixed(1)),
      ratingCount: agg._count._all,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await guard())) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const action = (body as any)?.action;

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 });

  if (action === 'approve' || action === 'hide') {
    const status = action === 'approve' ? ReviewStatus.APPROVED : ReviewStatus.REJECTED;
    await prisma.review.update({ where: { id: review.id }, data: { status } });
    await recomputeRating(review.productId);
    return NextResponse.json({ ok: true, status });
  }

  if (action === 'delete') {
    await prisma.review.delete({ where: { id: review.id } });
    await recomputeRating(review.productId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
