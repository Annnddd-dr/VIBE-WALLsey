import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { CouponType } from '@prisma/client';

const CreateCouponSchema = z.object({
  code: z.string().min(2).max(30).transform((s) => s.toUpperCase().trim()),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().int().min(1),
  minOrderAmount: z.number().int().min(0).default(0),
  firstOrderOnly: z.boolean().default(false),
  maxUsage: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).default(1),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({
    include: {
      _count: { select: { orders: true, usages: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'MANAGER')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check code uniqueness
  const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
  if (existing) {
    return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 409 });
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        type: data.type as CouponType,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        firstOrderOnly: data.firstOrderOnly,
        maxUsage: data.maxUsage ?? null,
        perUserLimit: data.perUserLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
        categoryId: data.categoryId ?? null,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (err: any) {
    console.error('[admin/coupons] Create error:', err);
    return NextResponse.json({ error: 'Failed to create coupon.' }, { status: 500 });
  }
}
