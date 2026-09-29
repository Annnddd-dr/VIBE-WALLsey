import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { getShippingRates, setStoreSetting, SETTING_KEYS } from '@/lib/store-settings';
import { z } from 'zod';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const rates = await getShippingRates();
  return NextResponse.json(rates);
}

const RatesSchema = z.object({
  freeShippingThreshold: z.number().int().min(0).max(1000000),
  flatShippingRate: z.number().int().min(0).max(100000),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RatesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid rates.' }, { status: 400 });
  }

  await setStoreSetting(SETTING_KEYS.freeShippingThreshold, parsed.data.freeShippingThreshold);
  await setStoreSetting(SETTING_KEYS.flatShippingRate, parsed.data.flatShippingRate);

  const rates = await getShippingRates();
  return NextResponse.json({ ok: true, ...rates });
}
