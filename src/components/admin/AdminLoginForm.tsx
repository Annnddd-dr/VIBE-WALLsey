'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';

export function AdminLoginForm({ unauthorized = false }: { unauthorized?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    unauthorized ? 'This account does not have admin portal access.' : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);
    if (!result || result.error) {
      setError('Email or password is incorrect.');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block space-y-2 text-sm font-medium text-ink">
        Work email
        <input
          type="email"
          required
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          className="input"
        />
      </label>

      <label className="block space-y-2 text-sm font-medium text-ink">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          className="input"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? <LoaderCircle size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
        Secure sign in
        {!loading && <ArrowRight size={16} className="ml-auto" />}
      </button>
    </form>
  );
}