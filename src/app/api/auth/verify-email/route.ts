import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, token } = await req.json().catch(() => ({}));
  if (!email || !token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 });

  const record = await prisma.verificationToken.findUnique({ where: { identifier_token: { identifier: email, token } } });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: 'This verification link is invalid or has expired.' }, { status: 400 });
  }

  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });

  return NextResponse.json({ ok: true });
}
