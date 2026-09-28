import { Resend } from 'resend';

function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

async function send(to: string, subject: string, html: string) {
  const client = getClient();
  if (!client) {
    console.log(`[email:skipped - no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  return client.emails.send({
    from: process.env.EMAIL_FROM ?? 'VIBEWALLseyy <orders@vibewallsey.com>',
    to,
    subject,
    html,
  });
}

function shell(title: string, bodyHtml: string) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#FAFAF8;font-family:Helvetica,Arial,sans-serif;color:#141414;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <p style="letter-spacing:2px;font-size:12px;text-transform:uppercase;color:#3E7C4F;font-weight:600;">VIBEWALLseyy</p>
      <h1 style="font-size:22px;margin:12px 0 20px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:40px;font-size:12px;color:#8a8a86;">VIBEWALLseyy · Premium wall posters, made in India.</p>
    </div>
  </body></html>`;
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${SITE}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  return send(
    email,
    'Verify your VIBEWALLseyy account',
    shell('Confirm your email', `<p>Click below to verify your account and start shopping.</p>
      <p><a href="${link}" style="display:inline-block;background:#141414;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">Verify email</a></p>`)
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const link = `${SITE}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  return send(
    email,
    'Reset your VIBEWALLseyy password',
    shell('Reset your password', `<p>Click below to set a new password. This link expires in 1 hour.</p>
      <p><a href="${link}" style="display:inline-block;background:#141414;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">Reset password</a></p>`)
  );
}

export async function sendOrderConfirmationEmail(email: string, orderNumber: string, total: string) {
  return send(
    email,
    `Order confirmed — ${orderNumber}`,
    shell('Your order is confirmed', `<p>Thanks for your order. We're preparing it for print.</p>
      <p><strong>Order:</strong> ${orderNumber}<br/><strong>Total:</strong> ${total}</p>
      <p><a href="${SITE}/account/orders" style="color:#C9491C;">Track your order</a></p>`)
  );
}

export async function sendOrderStatusEmail(email: string, orderNumber: string, status: string) {
  return send(
    email,
    `Order ${orderNumber}: ${status}`,
    shell('Order update', `<p>Your order <strong>${orderNumber}</strong> is now: <strong>${status}</strong></p>`)
  );
}
