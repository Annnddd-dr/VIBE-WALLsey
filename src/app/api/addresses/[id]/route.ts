import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateAddressSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional(),
  line1: z.string().min(3).max(200).optional(),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
  pincode: z.string().min(4).max(10).optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const existing = await prisma.address.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateAddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid details.' }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: params.id },
        data,
      });
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[addresses] Update error:', err);
    return NextResponse.json({ error: 'Failed to update address.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const existing = await prisma.address.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
  }

  try {
    await prisma.address.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err: any) {
    console.error('[addresses] Delete error:', err);
    return NextResponse.json({ error: 'Failed to delete address.' }, { status: 500 });
  }
}
