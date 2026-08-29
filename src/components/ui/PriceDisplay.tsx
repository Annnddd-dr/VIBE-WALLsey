import { formatINR } from '@/lib/utils';

export function PriceDisplay({ price, compareAt }: { price: number; compareAt?: number | null }) {
  const hasDiscount = compareAt && compareAt > price;
  const pct = hasDiscount ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0;

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-medium text-ink">{formatINR(price)}</span>
      {hasDiscount && (
        <>
          <span className="text-ink/40 line-through text-sm">{formatINR(compareAt!)}</span>
          <span className="text-accent text-xs font-semibold">{pct}% off</span>
        </>
      )}
    </div>
  );
}
