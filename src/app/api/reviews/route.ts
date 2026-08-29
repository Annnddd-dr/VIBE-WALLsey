import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  body: z.string().min(3).max(2000),
  images: z.array(z.string().url()).default([]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'You must be logged in to leave a review.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid review details.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check product exists
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    include: { variants: { select: { id: true } } },
  });
  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  // Check if user has purchased this product (verified buyer check)
  const variantIds = product.variants.map((v) => v.id);
  const userOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: {
        in: ['PAID', 'PROCESSING', 'PRINTING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'],
      },
      items: {
        some: {
          variantId: { in: variantIds },
        },
      },
    },
  });

  const isVerifiedPurchase = Boolean(userOrder);

  try {
    const review = await prisma.$transaction(async (tx) => {
      // 1. Create review
      const newReview = await tx.review.create({
        data: {
          productId: data.productId,
          userId,
          rating: data.rating,
          title: data.title || null,
          body: data.body,
          images: data.images,
          verifiedPurchase: isVerifiedPurchase,
          status: 'APPROVED', // Instant approval
        },
        include: {
          user: { select: { name: true, image: true } },
        },
      });

      // 2. Recompute rating metrics
      const aggregates = await tx.review.aggregate({
        where: { productId: data.productId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const ratingAvg = Number((aggregates._avg.rating ?? data.rating).toFixed(1));
      const ratingCount = aggregates._count.rating ?? 1;

      await tx.product.update({
        where: { id: data.productId },
        data: { ratingAvg, ratingCount },
      });

      return newReview;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (err: any) {
    console.error('[reviews] Error:', err);
    return NextResponse.json({ error: 'Failed to submit review.' }, { status: 500 });
  }
}
