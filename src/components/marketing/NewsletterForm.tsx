'use client';

import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  return (
    <form
      className="mt-6 flex gap-2 max-w-sm mx-auto"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus('sent');
      }}
    >
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="input flex-1" />
      <button type="submit" className="btn btn-primary shrink-0">
        {status === 'sent' ? 'Subscribed' : 'Join'}
      </button>
    </form>
  );
}
