import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddressSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
  line1: z.string().min(3).max(200),
  line2: z.string().max(200).optional().nullable(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().min(4).max(10),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid address information.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const address = await prisma.$transaction(async (tx) => {
      // If marked as default or is the user's first address, reset other defaults
      const count = await tx.address.count({ where: { userId } });
      const makeDefault = data.isDefault || count === 0;

      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          name: data.name,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          isDefault: makeDefault,
        },
      });
    });

    return NextResponse.json(address, { status: 201 });
  } catch (err: any) {
    console.error('[addresses] Create error:', err);
    return NextResponse.json({ error: 'Failed to save address.' }, { status: 500 });
  }
}
