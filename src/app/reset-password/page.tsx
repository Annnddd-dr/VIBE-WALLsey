'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm border border-line rounded-sm p-8 bg-surface text-center text-sm text-ink/50">
            Loading…
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
