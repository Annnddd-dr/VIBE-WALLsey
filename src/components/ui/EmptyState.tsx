import Link from 'next/link';

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <h3 className="text-xl font-display">{title}</h3>
      {description && <p className="mt-2 text-sm text-ink/60 max-w-sm">{description}</p>}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn btn-primary mt-6">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
