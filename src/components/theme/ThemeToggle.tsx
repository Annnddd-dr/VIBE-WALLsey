'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

/**
 * Animated theme switch — sun ☀ (light) ↔ crescent moon ☾ (dark).
 * Icon cross-rotates and fades; a tiny star appears in dark mode.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to sunrise (light) mode' : 'Switch to night sky (dark) mode'}
      title={isDark ? 'Sunrise mode' : 'Night sky mode'}
      className={`no-theme-fade relative flex h-9 w-9 items-center justify-center rounded-full text-ink/80 transition-colors hover:text-ink hover:bg-ink/5 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            {/* Crescent moon + star (☾ ✦) */}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20.2 14.2A8.3 8.3 0 0 1 9.8 3.8a8.3 8.3 0 1 0 10.4 10.4Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M17.5 3.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" fill="currentColor" />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-center justify-center"
          >
            {/* Sun with rays (☀) */}
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * Math.PI) / 4;
                const x1 = 12 + Math.cos(angle) * 6.8;
                const y1 = 12 + Math.sin(angle) * 6.8;
                const x2 = 12 + Math.cos(angle) * 9.2;
                const y2 = 12 + Math.sin(angle) * 9.2;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
