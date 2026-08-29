import { cn } from '@/lib/utils';

export function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'accent' | 'muted' }) {
  return (
    <span
      className={cn(
        'inline-block text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-sm',
        tone === 'default' && 'bg-ink text-paper',
        tone === 'accent' && 'bg-accent text-white',
        tone === 'muted' && 'bg-line text-ink/70'
      )}
    >
      {children}
    </span>
  );
}
