import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().max(15).optional().or(z.literal('')),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.', details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // The register page now prefers OTP sign-in for phone-first accounts, but if
  // a phone is supplied with email+password, make sure no OTHER user owns it.
  if (phone) {
    const normalized = phone.replace(/\D/g, '').slice(-10);
    const phoneOwner = await prisma.user.findFirst({
      where: { phone: { endsWith: normalized } },
      select: { email: true },
    });
    if (phoneOwner && phoneOwner.email !== normalizedEmail) {
      return NextResponse.json(
        { error: 'This mobile number is already linked to a different account.' },
        { status: 409 }
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone: phone ? phone.replace(/\D/g, '').slice(-10) : null,
      passwordHash,
    },
  });

  const token = randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });

  const result = await sendVerificationEmail(user.email, token).catch((err) => {
    console.error('Failed to send verification email:', err);
    return null;
  });

  // No mail provider configured (local dev): surface the link so the flow is
  // completable. Never exposed when RESEND_API_KEY is set.
  const devLink = !process.env.RESEND_API_KEY
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`
    : undefined;

  return NextResponse.json(
    { ok: true, message: 'Account created. Check your email to verify.', devVerificationLink: devLink },
    { status: 201 }
  );
}
