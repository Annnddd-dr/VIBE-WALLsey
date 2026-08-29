'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(res.error === 'EMAIL_NOT_VERIFIED' ? 'Please verify your email before signing in.' : 'Invalid email or password.');
      return;
    }
    router.push('/account');
  }

  return (
    <div className="container-page py-16 max-w-md mx-auto">
      <h1 className="text-3xl font-display">Welcome back</h1>
      <p className="text-ink/60 text-sm mt-2 mb-8">Sign in to continue to checkout.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" required placeholder="Email address" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
        <div className="flex-1 h-px bg-line" /> or <div className="flex-1 h-px bg-line" />
      </div>
      <button onClick={() => signIn('google')} className="btn btn-ghost w-full">Continue with Google</button>

      <p className="text-sm text-ink/60 mt-8">
        New here? <Link href="/register" className="text-accent">Create an account</Link>
      </p>
    </div>
  );
}
