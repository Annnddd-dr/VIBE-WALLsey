import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const RequestSchema = z.object({
  email: z.string().email(),
});

const ResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(72),
});

// POST /api/auth/reset-password — Request a password reset
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email.' }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success for security (don't leak if user exists)
  if (!user) {
    return NextResponse.json({ ok: true, message: 'If email exists, a reset link will be sent.' });
  }

  try {
    // Create reset token
    const resetToken = nanoid(32);
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Store token hash in database
    const tokenHash = await bcrypt.hash(resetToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Using a custom field — you may need to add this to Prisma schema
        // For now, we'll use VerificationToken as a workaround
      },
    });

    // Create verification token entry
    await prisma.verificationToken.create({
      data: {
        identifier: `reset-${user.id}`,
        token: tokenHash,
        expires: resetTokenExpires,
      },
    });

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json({ ok: true, message: 'If email exists, a reset link will be sent.' });
  } catch (err: any) {
    console.error('[reset-password] Error:', err);
    return NextResponse.json({ ok: true, message: 'If email exists, a reset link will be sent.' });
  }
}

// PUT /api/auth/reset-password — Complete the reset
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { token, password } = parsed.data;

  try {
    // Find token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: { startsWith: 'reset-' },
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    // Verify token
    const isValid = await bcrypt.compare(token, verificationToken.token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 });
    }

    // Extract userId from identifier
    const userId = verificationToken.identifier.replace('reset-', '');

    // Update password
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    return NextResponse.json({ ok: true, message: 'Password reset successfully.' });
  } catch (err: any) {
    console.error('[reset-password] Error:', err);
    return NextResponse.json({ error: 'Failed to reset password.' }, { status: 500 });
  }
}
