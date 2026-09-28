'use client';

import Link from 'next/link';
import { MoonStar, Sparkles, LayoutGrid, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'posterraxx-admin-theme';

type AdminMode = 'studio' | 'luxury';

export function AdminModeSwitcher() {
  const [mode, setMode] = useState<AdminMode>('studio');

  useEffect(() => {
    const savedMode = window.localStorage.getItem(STORAGE_KEY) as AdminMode | null;
    if (savedMode === 'studio' || savedMode === 'luxury') {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    const shell = document.querySelector('.admin-shell');
    if (!shell) return;
    shell.classList.toggle('dark-luxury', mode === 'luxury');
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/5 p-1.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setMode('studio')}
        aria-pressed={mode === 'studio'}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          mode === 'studio'
            ? 'bg-white/80 text-ink shadow-sm'
            : 'text-ink/60 hover:text-ink'
        }`}
      >
        <LayoutGrid size={14} />
        Studio
      </button>

      <button
        type="button"
        onClick={() => setMode('luxury')}
        aria-pressed={mode === 'luxury'}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
          mode === 'luxury'
            ? 'bg-ink text-paper shadow-[0_0_20px_rgba(15,23,42,0.4)]'
            : 'text-ink/60 hover:text-ink'
        }`}
      >
        <MoonStar size={14} />
        Luxury
      </button>

      <Link
        href="/"
        className="ml-1 flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/15"
      >
        <Sparkles size={14} />
        Main site
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/admin-login' })}
        aria-label="Sign out"
        title="Sign out"
        className="rounded-full border border-white/10 bg-black/5 p-2 text-ink/60 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-600"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
