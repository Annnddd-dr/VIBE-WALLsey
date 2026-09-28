'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = 'vibewallsey_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Sync from the class the no-flash script already applied to <html>.
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    setMounted(true);
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    const root = document.documentElement;
    // Long cross-fade on the first paint after a manual switch.
    root.classList.add('theme-fade');
    root.classList.toggle('dark', next === 'dark');
    window.setTimeout(() => root.classList.remove('theme-fade'), 1400);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  return <Ctx.Provider value={{ theme, toggleTheme, mounted }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
