import Link from 'next/link';
import { Truck, Printer, PackageCheck, AlertCircle } from 'lucide-react';
import { getShippingRates } from '@/lib/store-settings';

export const metadata = { title: 'Shipping Policy · VIBEWALLseyy' };

const ROWS = [
  { size: 'A6 / A5', time: '24–48 h dispatch · 4–7 days delivery' },
  { size: 'A4 / A3', time: '24–48 h dispatch · 4–7 days delivery' },
  { size: 'POLAROID', time: '24–48 h dispatch · 4–7 days delivery' },
];

export default async function ShippingPolicyPage() {
  const { freeShippingThreshold, flatShippingRate } = await getShippingRates();
  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;
  return (
    <div className="container-page py-12 lg:py-20 max-w-3xl">
      <p className="eyebrow">Policies</p>
      <h1 className="text-3xl lg:text-4xl mt-2">Shipping Policy</h1>
      <p className="text-ink-secondary text-sm mt-3">
        Every poster is printed to order in our Bangalore studio — nothing sits in a warehouse.
      </p>

      <div className="mt-10 space-y-8">
        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <Printer size={16} className="text-accent" />
            <h2 className="font-display text-lg">Print & dispatch</h2>
          </div>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
            Orders are printed within 24–48 hours of payment confirmation (COD orders: on confirmation call). You
            receive a dispatch email with a courier tracking number the moment your parcel leaves the studio.
          </p>
        </section>

        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-accent" />
            <h2 className="font-display text-lg">Delivery timelines</h2>
          </div>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-ink/50 border-b border-line">
                <th className="py-2">Format</th>
                <th className="py-2">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.size} className="border-b border-line/60">
                  <td className="py-2.5">{r.size}</td>
                  <td className="py-2.5 text-ink-secondary">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-ink/50 mt-3">Metro cities: usually 3–4 days. Remote PINs: up to 7–8 days.</p>
        </section>

        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-accent" />
            <h2 className="font-display text-lg">Charges & free shipping</h2>
          </div>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
            Flat {fmt(flatShippingRate)} shipping across India — free on orders above {fmt(freeShippingThreshold)}. COD
            available on all PIN codes we serve. Exact charges always show in your cart before you pay.
          </p>
        </section>

        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-accent" />
            <h2 className="font-display text-lg">Damaged in transit?</h2>
          </div>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
            We pack in rigid, corner-protected tubes, but if a print arrives damaged, email{' '}
            <a href="mailto:support@vibewallsey.com" className="text-accent underline">
              support@vibewallsey.com
            </a>{' '}
            within 48 hours with a photo — a free replacement ships immediately. See the{' '}
            <Link href="/returns" className="text-accent underline">
              refund policy
            </Link>{' '}
            for details.
          </p>
        </section>
      </div>
    </div>
  );
}
