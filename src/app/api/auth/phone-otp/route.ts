import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { issueOtp, isValidIndianPhone, normalizePhone } from '@/lib/phone-otp';

const Schema = z.object({
  phone: z.string().min(10).max(15),
  name: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success || !isValidIndianPhone(parsed.data.phone)) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  const result = await issueOtp(parsed.data.phone);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({
    ok: true,
    phone: normalizePhone(parsed.data.phone),
    // Dev convenience only — present when no SMS provider is configured.
    devCode: result.devCode,
    devMode: !!result.devCode,
  });
}
