import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
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

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({ data: { name, email: normalizedEmail, phone, passwordHash } });

  const token = randomBytes(32).toString('hex');
  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });

  await sendVerificationEmail(user.email, token).catch((err) => {
    console.error('Failed to send verification email:', err);
  });

  return NextResponse.json({ ok: true, message: 'Account created. Check your email to verify.' }, { status: 201 });
}
