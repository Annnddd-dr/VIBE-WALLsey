'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    if (!email || !token) {
      setStatus('error');
      return;
    }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    })
      .then((res) => setStatus(res.ok ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className="container-page py-24 max-w-md mx-auto text-center">
      {status === 'loading' && <p className="text-ink/60">Verifying your email...</p>}
      {status === 'ok' && (
        <>
          <h1 className="text-2xl font-display">Email verified</h1>
          <p className="text-ink/60 mt-3">You&apos;re all set. You can sign in now.</p>
          <Link href="/login" className="btn btn-primary mt-6">Sign in</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-display">Link invalid or expired</h1>
          <p className="text-ink/60 mt-3">Please request a new verification email from the sign-in page.</p>
          <Link href="/login" className="btn btn-ghost mt-6">Back to sign in</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
