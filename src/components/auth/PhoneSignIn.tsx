'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * Shared phone-number sign-in flow: request an OTP, then verify it.
 * Used on both the login and register pages. In dev (no SMS provider
 * configured) the code is returned and displayed — clearly labelled.
 */
export function PhoneSignIn({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not send the code.');
      setDevCode(data.devCode ?? null);
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('phone-otp', {
      phone,
      code,
      name,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Incorrect or expired code. Please try again.');
      return;
    }
    onDone?.();
    window.location.href = '/account';
  }

  return (
    <div className="border border-line rounded-sm bg-surface p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink/60">
        <Smartphone size={14} className="text-accent" /> Sign in with phone
      </p>

      {step === 'phone' ? (
        <form onSubmit={requestCode} className="mt-4 space-y-3">
          {name !== undefined && (
            <input
              type="text"
              placeholder="Your name (for new accounts)"
              className="input text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <div className="flex items-stretch gap-2">
            <span className="inline-flex items-center px-3 border border-line rounded-sm bg-paper text-sm text-ink/60 select-none">
              +91
            </span>
            <input
              type="tel"
              required
              inputMode="numeric"
              pattern="[0-9]{10}"
              title="10-digit Indian mobile number"
              placeholder="98765 43210"
              className="input flex-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              autoComplete="tel-national"
            />
          </div>
          {error && <p className="text-sm text-accent">{error}</p>}
          <button type="submit" disabled={loading || phone.length !== 10} className="btn btn-primary w-full gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            Send code
          </button>
          <p className="text-[11px] text-ink/40 flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-accent" />
            We&apos;ll text you a 6-digit code. Standard rates apply.
          </p>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-4 space-y-3">
          <p className="text-sm text-ink/60">
            Code sent to <span className="font-medium text-ink">+91 {phone}</span>{' '}
            <button type="button" onClick={() => setStep('phone')} className="text-accent text-xs underline">
              change
            </button>
          </p>
          {devCode && (
            <div className="border border-dashed border-accent/60 bg-accent/5 rounded-sm p-3 text-xs">
              <p className="font-semibold text-ink mb-0.5">Dev mode — SMS not configured</p>
              <p className="text-ink/60">
                Your code is <span className="font-mono text-base font-bold tracking-widest text-accent">{devCode}</span>
              </p>
            </div>
          )}
          <input
            type="text"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit code"
            className="input text-center font-mono text-lg tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            autoComplete="one-time-code"
            autoFocus
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary w-full gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            Verify &amp; sign in
          </button>
          <button
            type="button"
            onClick={() => requestCode()}
            disabled={loading}
            className="w-full text-xs text-ink/40 hover:text-ink transition-colors"
          >
            Didn&apos;t get it? Resend code
          </button>
        </form>
      )}
    </div>
  );
}
