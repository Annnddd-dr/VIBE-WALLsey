import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const STATUSES = [
  'PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'PRINTING', 'PACKED',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED',
] as const;

const ListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// --- GET: list orders with search, status filter, and pagination ---
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = ListSchema.safeParse({
    search: url.searchParams.get('search') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    page: url.searchParams.get('page') ?? '1',
    pageSize: url.searchParams.get('pageSize') ?? '20',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { search, status, page, pageSize } = parsed.data;

  const where: any = {};
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      {
        user: {
          is: { name: { contains: search, mode: 'insensitive' } },
        },
      },
      {
        address: {
          is: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { pincode: { contains: search } },
            ],
          },
        },
      },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        items: true,
        address: { select: { name: true, city: true, state: true, pincode: true } },
        shipment: true,
      },
    }),
  ]);

  return NextResponse.json({
    orders,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}