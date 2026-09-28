import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens driven by CSS variables (see globals.css).
        // Light = sunrise palette, dark (.dark) = night-sky palette.
        ink: 'rgb(var(--c-primary) / <alpha-value>)',
        'ink-secondary': 'rgb(var(--c-secondary) / <alpha-value>)',
        paper: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        line: 'rgb(var(--c-border) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        // Legacy names kept so existing components keep working,
        // now resolving to the theme-aware tokens.
        charcoal: 'rgb(var(--c-primary) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      maxWidth: { content: '1440px' },
      boxShadow: {
        glass: '0 8px 32px rgb(23 23 23 / 0.06)',
        'glass-dark': '0 8px 32px rgb(0 0 0 / 0.4)',
        lift: '0 12px 40px -8px rgb(23 23 23 / 0.18)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'slide-in': 'slide-in 0.3s ease-out both',
        shimmer: 'shimmer 1.8s linear infinite',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
