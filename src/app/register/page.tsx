'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
    setDone(true);
  }

  if (done) {
    return (
      <div className="container-page py-24 max-w-md mx-auto text-center">
        <h1 className="text-2xl font-display">Check your email</h1>
        <p className="text-ink/60 mt-3">We sent a verification link to {form.email}. Verify your account, then sign in.</p>
        <Link href="/login" className="btn btn-primary mt-6">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-16 max-w-md mx-auto">
      <h1 className="text-3xl font-display">Create account</h1>
      <p className="text-ink/60 text-sm mt-2 mb-8">Sign up to track orders and save addresses.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Full name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="email" required placeholder="Email address" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="tel" required placeholder="Phone number" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input type="password" required minLength={8} placeholder="Password (min. 8 characters)" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-ink/60 mt-8">
        Already have an account? <Link href="/login" className="text-accent">Sign in</Link>
      </p>
    </div>
  );
}
