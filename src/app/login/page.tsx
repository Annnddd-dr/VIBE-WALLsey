'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { PhoneSignIn } from '@/components/auth/PhoneSignIn';
import { GoogleIcon } from '@/components/auth/GoogleIcon';

type Method = 'choose' | 'email' | 'phone';

export default function LoginPage() {
  const [method, setMethod] = useState<Method>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(
        res.error === 'EMAIL_NOT_VERIFIED'
          ? 'Please verify your email before signing in.'
          : 'Invalid email or password.'
      );
      return;
    }
    router.push('/account');
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    await signIn('google', { callbackUrl: '/account' });
  }

  return (
    <div className="container-page py-14 max-w-md mx-auto">
      <h1 className="text-3xl font-display">Welcome back</h1>
      <p className="text-ink/60 text-sm mt-2 mb-8">Sign in to track orders, save posters and check out faster.</p>

      {method === 'choose' && (
        <div className="space-y-3">
          <button onClick={() => setMethod('phone')} className="btn btn-primary w-full gap-2 justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <path d="M12 18h.01" />
            </svg>
            Continue with phone
          </button>
          <button onClick={handleGoogle} className="btn btn-ghost w-full gap-2.5 justify-center border-line">
            <GoogleIcon />
            Continue with Google
          </button>
          <button onClick={() => setMethod('email')} className="btn btn-ghost w-full gap-2 justify-center border-line">
            <Mail size={15} className="text-accent" />
            Continue with email
          </button>
        </div>
      )}

      {method === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email address"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          <div>
            <input
              type="password"
              required
              placeholder="Password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Link href="/forgot-password" className="text-xs text-ink/40 hover:text-accent mt-2 inline-block transition-colors">
              Forgot password?
            </Link>
          </div>
          {error && <p className="text-sm text-accent">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            Sign in
          </button>
          <button type="button" onClick={() => setMethod('choose')} className="w-full text-xs text-ink/40 hover:text-ink transition-colors">
            ← Other sign-in options
          </button>
        </form>
      )}

      {method === 'phone' && (
        <div className="space-y-4">
          <PhoneSignIn />
          <button onClick={() => setMethod('choose')} className="w-full text-xs text-ink/40 hover:text-ink transition-colors">
            ← Other sign-in options
          </button>
        </div>
      )}

      <div className="my-8 flex items-center gap-3 text-xs text-ink/40">
        <div className="flex-1 h-px bg-line" /> New here? <div className="flex-1 h-px bg-line" />
      </div>

      <p className="text-sm text-ink/60 text-center">
        <Link href="/register" className="text-accent hover:underline">
          Create an account
        </Link>{' '}
        — it takes 30 seconds.
      </p>
    </div>
  );
}
