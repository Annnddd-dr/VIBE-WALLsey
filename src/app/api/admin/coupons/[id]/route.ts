import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { CouponType } from '@prisma/client';

const UpdateCouponSchema = z.object({
  type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  value: z.number().int().min(1).optional(),
  minOrderAmount: z.number().int().min(0).optional(),
  firstOrderOnly: z.boolean().optional(),
  maxUsage: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'MANAGER')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const updateData: any = {};

  if (data.type !== undefined) updateData.type = data.type as CouponType;
  if (data.value !== undefined) updateData.value = data.value;
  if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
  if (data.firstOrderOnly !== undefined) updateData.firstOrderOnly = data.firstOrderOnly;
  if (data.maxUsage !== undefined) updateData.maxUsage = data.maxUsage;
  if (data.perUserLimit !== undefined) updateData.perUserLimit = data.perUserLimit;
  if (data.expiresAt !== undefined) {
    updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  }
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

  try {
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });
    return NextResponse.json(coupon);
  } catch (err: any) {
    console.error('[admin/coupons] Update error:', err);
    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'ADMIN')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await prisma.coupon.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err: any) {
    console.error('[admin/coupons] Delete error:', err);
    return NextResponse.json({ error: 'Failed to delete coupon.' }, { status: 500 });
  }
}
