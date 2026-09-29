import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function OrderConfirmedPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <div className="container-page py-24 flex flex-col items-center text-center">
      <CheckCircle2 size={48} className="text-accent" />
      <h1 className="text-3xl font-display mt-6">Order confirmed</h1>
      {searchParams.order && <p className="text-ink/60 mt-2">Order number: <strong>{searchParams.order}</strong></p>}
      <p className="text-ink/60 mt-1 max-w-sm">
  We&apos;re preparing your print. A confirmation email is on its way.
</p>
      <div className="flex gap-4 mt-8">
        <Link href={searchParams.order ? `/track-order?order=${encodeURIComponent(searchParams.order)}` : '/track-order'} className="btn btn-primary">Track order</Link>
        <Link href="/shop" className="btn btn-ghost">Continue shopping</Link>
      </div>
    </div>
  );
}
