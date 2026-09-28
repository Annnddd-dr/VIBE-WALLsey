'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Request failed');
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <div className="border border-line rounded-sm p-8 bg-surface">
          <h1 className="text-2xl font-display mb-2">Reset Password</h1>
          <p className="text-xs text-ink/50 mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-base font-semibold text-ink mb-2">Check your email</h2>
              <p className="text-xs text-ink/60 mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to create a new password.
              </p>
              <p className="text-xs text-ink/50 mb-6">
                The link expires in 1 hour.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-sm text-ink/60 hover:text-ink transition-colors"
              >
                Enter a different email →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-sm">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-ink/60 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn btn-primary w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <p className="text-xs text-ink/40 text-center pt-4">
                Remember your password?{' '}
                <Link href="/login" className="text-accent hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
