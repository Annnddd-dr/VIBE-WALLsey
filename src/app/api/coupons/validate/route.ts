import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCartLines } from '@/lib/cart';
import { priceCart, PricingError } from '@/lib/pricing';
import { z } from 'zod';

const Schema = z.object({ code: z.string().min(1) });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Coupon code required.' }, { status: 400 });

  const { items } = await getCartLines(userId);
  if (items.length === 0) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });

  try {
    const summary = await priceCart(
      items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      { couponCode: parsed.data.code, userId: userId ?? undefined }
    );
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    if (err instanceof PricingError) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ error: 'Could not validate coupon.' }, { status: 500 });
  }
}
