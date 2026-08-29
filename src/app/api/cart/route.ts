import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addToCart, getCartLines, removeCartItem, updateCartItemQuantity } from '@/lib/cart';
import { priceCart } from '@/lib/pricing';
import { z } from 'zod';

async function currentUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id ?? null;
}

export async function GET() {
  const userId = await currentUserId();
  const { items } = await getCartLines(userId);

  if (items.length === 0) {
    return NextResponse.json({ items: [], summary: null });
  }

  const summary = await priceCart(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
  return NextResponse.json({ items, summary });
}

const AddSchema = z.object({ variantId: z.string(), quantity: z.number().int().min(1).max(20).default(1) });

export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  const body = await req.json().catch(() => null);
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid item.' }, { status: 400 });

  try {
    await addToCart(userId, parsed.data.variantId, parsed.data.quantity);
    const { items } = await getCartLines(userId);
    const summary = await priceCart(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
    return NextResponse.json({ items, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Could not add to cart.' }, { status: 400 });
  }
}

const UpdateSchema = z.object({ variantId: z.string(), quantity: z.number().int().min(0).max(20) });

export async function PATCH(req: NextRequest) {
  const userId = await currentUserId();
  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });

  await updateCartItemQuantity(userId, parsed.data.variantId, parsed.data.quantity);
  const { items } = await getCartLines(userId);
  const summary = items.length ? await priceCart(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))) : null;
  return NextResponse.json({ items, summary });
}

export async function DELETE(req: NextRequest) {
  const userId = await currentUserId();
  const { searchParams } = new URL(req.url);
  const variantId = searchParams.get('variantId');
  if (!variantId) return NextResponse.json({ error: 'variantId required.' }, { status: 400 });

  await removeCartItem(userId, variantId);
  const { items } = await getCartLines(userId);
  const summary = items.length ? await priceCart(items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))) : null;
  return NextResponse.json({ items, summary });
}
