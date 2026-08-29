import { Star } from 'lucide-react';

export function Rating({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${value} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-ink text-ink' : 'fill-line text-line'} />
        ))}
      </div>
      {typeof count === 'number' && <span className="text-xs text-ink/50">({count})</span>}
    </div>
  );
}
