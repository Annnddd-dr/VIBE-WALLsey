'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Loader2, Mail, UserPlus } from 'lucide-react';
import { PhoneSignIn } from '@/components/auth/PhoneSignIn';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

type Method = 'choose' | 'email' | 'phone';

export default function RegisterPage() {
  const [method, setMethod] = useState<Method>('choose');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not create account.');
      return;
    }
    setDevLink(data.devVerificationLink ?? null);
    setDone(true);
  }

  async function handleGoogle() {
    setError(null);
    await signIn('google', { callbackUrl: '/account' });
  }

  if (method === 'email' && done) {
    return (
      <div className="container-page py-24 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-display">Check your email</h1>
        <p className="text-ink/60 mt-3">
          We sent a verification link to {form.email}. Verify your account, then sign in.
        </p>
        {devLink && (
          <div className="mt-6 border border-line rounded-sm p-4 text-left bg-surface">
            <p className="text-xs text-ink/50 mb-2">
              Dev mode — no email provider configured. Verify directly:
            </p>
            <a href={devLink} className="text-accent text-sm underline break-all">
              {devLink}
            </a>
          </div>
        )}
        <Link href="/login" className="btn btn-primary mt-6">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-14 max-w-md mx-auto">
      <h1 className="text-3xl font-display">Create account</h1>
      <p className="text-ink/60 text-sm mt-2 mb-8">Track orders, save addresses and check out faster.</p>

      {method === 'choose' && (
        <div className="space-y-3">
          <button onClick={() => setMethod('phone')} className="btn btn-primary w-full gap-2 justify-center">
            <UserPlus size={15} />
            Sign up with phone
          </button>
          <button onClick={handleGoogle} className="btn btn-ghost w-full gap-2.5 justify-center border-line">
            <GoogleIcon />
            Sign up with Google
          </button>
          <button onClick={() => setMethod('email')} className="btn btn-ghost w-full gap-2 justify-center border-line">
            <Mail size={15} className="text-accent" />
            Sign up with email
          </button>
          <p className="text-[11px] text-ink/40 text-center pt-1">
            Phone &amp; Google sign-ups are instant — no email verification needed.
          </p>
        </div>
      )}

      {method === 'email' && (
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <input
            required
            placeholder="Full name"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            autoFocus
          />
          <input
            type="email"
            required
            placeholder="Email address"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            autoComplete="tel-national"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min. 8 characters)"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Create account
          </button>
          <button type="button" onClick={() => setMethod('choose')} className="w-full text-xs text-ink/40 hover:text-ink transition-colors">
            ← Other sign-up options
          </button>
        </form>
      )}

      {method === 'phone' && (
        <div className="space-y-4">
          <PhoneSignIn />
          <button onClick={() => setMethod('choose')} className="w-full text-xs text-ink/40 hover:text-ink transition-colors">
            ← Other sign-up options
          </button>
        </div>
      )}

      <div className="my-8 flex items-center gap-3 text-xs text-ink/40">
        <div className="flex-1 h-px bg-line" /> Already with us? <div className="flex-1 h-px bg-line" />
      </div>

      <p className="text-sm text-ink/60 text-center">
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>{' '}
        instead
      </p>
    </div>
  );
}
