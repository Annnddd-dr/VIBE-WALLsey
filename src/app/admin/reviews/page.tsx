import { prisma } from '@/lib/prisma';
import { ReviewStatus } from '@prisma/client';
import { AdminReviewsClient } from './AdminReviewsClient';

export const metadata = { title: 'Reviews — VIBEWALLseyy Admin' };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter =
    searchParams.status && ['PENDING', 'APPROVED', 'REJECTED'].includes(searchParams.status)
      ? (searchParams.status as ReviewStatus)
      : undefined;

  const [reviews, counts] = await Promise.all([
    prisma.review.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        product: { select: { title: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.review.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);

  const countFor = (s: ReviewStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <AdminReviewsClient
      reviews={reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        verifiedPurchase: r.verifiedPurchase,
        createdAt: r.createdAt.toISOString(),
        product: r.product,
        user: r.user,
      }))}
      counts={{
        PENDING: countFor('PENDING'),
        APPROVED: countFor('APPROVED'),
        REJECTED: countFor('REJECTED'),
      }}
      activeStatus={statusFilter ?? 'ALL'}
    />
  );
}
