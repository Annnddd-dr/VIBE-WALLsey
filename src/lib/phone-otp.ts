import 'server-only';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CODES_PER_PHONE_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export function normalizePhone(input: string): string {
  // Strip everything but digits; keep last 10 (Indian numbers). Store with country code.
  const digits = input.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? `+91${last10}` : `+${digits}`;
}

export function isValidIndianPhone(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  return digits.length === 10 && /^[6-9]/.test(digits);
}

/**
 * Issue an OTP for a phone number. Rate-limited per phone.
 * Returns the plaintext code ONLY when no SMS provider is configured
 * (dev mode) so the UI can show it — never in production with SMS wired.
 */
export async function issueOtp(phone: string): Promise<{ ok: true; devCode?: string } | { ok: false; error: string }> {
  const normalized = normalizePhone(phone);

  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.phoneOtp.count({
    where: { phone: normalized, createdAt: { gte: since } },
  });
  if (recentCount >= MAX_CODES_PER_PHONE_PER_HOUR) {
    return { ok: false, error: 'Too many codes requested. Please try again in an hour.' };
  }

  // Invalidate previous unused codes for this phone.
  await prisma.phoneOtp.deleteMany({ where: { phone: normalized } });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.phoneOtp.create({
    data: {
      phone: normalized,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const devCode = process.env.SMS_PROVIDER_KEY ? undefined : code;

  if (process.env.SMS_PROVIDER_KEY) {
    // Production path: wire your SMS provider here (Twilio / MSG91 / TextLocal).
    // A generic, honest failure beats silently dropping the message.
    try {
      await sendSms(normalized, code);
    } catch (err) {
      console.error('[phone-otp] SMS send failed:', err);
      return { ok: false, error: 'Could not send the SMS. Please try again.' };
    }
  } else if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_OTP !== 'true') {
    return { ok: false, error: 'SMS is not configured on this deployment yet.' };
  }

  return { ok: true, devCode };
}

async function sendSms(phone: string, code: string) {
  // Placeholder for the real provider integration. Keep the surface tiny:
  // one function, one job. Configure SMS_PROVIDER_KEY to enable.
  throw new Error('No SMS provider configured.');
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizePhone(phone);
  const record = await prisma.phoneOtp.findFirst({
    where: { phone: normalized },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return { ok: false, error: 'Request a new code first.' };
  if (record.expiresAt < new Date()) {
    await prisma.phoneOtp.deleteMany({ where: { phone: normalized } });
    return { ok: false, error: 'That code expired. Request a new one.' };
  }
  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.phoneOtp.deleteMany({ where: { phone: normalized } });
    return { ok: false, error: 'Too many wrong attempts. Request a new code.' };
  }

  const valid = await bcrypt.compare(code.trim(), record.codeHash);
  if (!valid) {
    await prisma.phoneOtp.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, error: 'Incorrect code. Please try again.' };
  }

  // Single-use: burn the code.
  await prisma.phoneOtp.deleteMany({ where: { phone: normalized } });
  return { ok: true };
}
