import type { Metadata } from 'next';
import { TrackOrderClient } from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'Track Order',
  description: 'Follow your VIBEWALLseyy print from the studio to your wall.',
};

export default function TrackOrderPage({
  searchParams,
}: {
  searchParams?: { order?: string };
}) {
  return <TrackOrderClient prefillOrder={searchParams?.order} />;
}
