import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ items: [] });
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        select: { productId: true },
      },
    },
  });

  const productIds = wishlist ? wishlist.items.map((i) => i.productId) : [];
  return NextResponse.json({ items: productIds });
}

const ToggleSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Sign in to save to your cloud wishlist.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Product ID required.' }, { status: 400 });
  }

  const { productId } = parsed.data;

  // Get or create user wishlist
  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }

  // Check if item already in wishlist
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
  });

  if (existing) {
    // Remove
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ added: false, productId });
  } else {
    // Add
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });
    return NextResponse.json({ added: true, productId });
  }
}
