import Link from 'next/link';
import { RotateCcw, AlertCircle, PackageCheck, IndianRupee } from 'lucide-react';

export const metadata = { title: 'Refund Policy · VIBEWALLseyy' };

export default function RefundPolicyPage() {
  return (
    <div className="container-page py-12 lg:py-20 max-w-3xl">
      <p className="eyebrow">Policies</p>
      <h1 className="text-3xl lg:text-4xl mt-2">Refund & Return Policy</h1>
      <p className="text-ink-secondary text-sm mt-3">
        Prints are made to order, so here is exactly when we remake or refund — no fine print games.
      </p>

      <div className="mt-10 space-y-8">
        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-accent" />
            <h2 className="font-display text-lg">7-day report window</h2>
          </div>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
            If your order arrives damaged, misprinted, or isn&apos;t what you ordered, email{' '}
            <a href="mailto:support@vibewallsey.com" className="text-accent underline">
              support@vibewallsey.com
            </a>{' '}
            within 7 days of delivery with your order number and a photo. We remake and reship free, or refund in
            full — your choice.
          </p>
        </section>

        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <PackageCheck size={16} className="text-accent" />
            <h2 className="font-display text-lg">What we remake free</h2>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-secondary list-disc list-inside">
            <li>Damage in transit (please share an unboxing photo where possible)</li>
            <li>Wrong size, wrong design, or wrong quantity shipped</li>
            <li>Print defects: banding, colour shifts, creases, smudges</li>
            <li>Lost parcels (after the courier&apos;s 7-day trace window)</li>
          </ul>
        </section>

        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-accent" />
            <h2 className="font-display text-lg">What we can&apos;t accept</h2>
          </div>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
            Because every piece is printed just for you, we can&apos;t accept returns for change of mind, colour
            differences from your screen (we print colour-calibrated, but screens vary), or custom designs approved
            by you at checkout. If something feels off with a custom design, message us <em>before</em> the print
            starts — within 12 hours of ordering, changes are free.
          </p>
        </section>

        <section className="glass-card rounded-sm p-6">
          <div className="flex items-center gap-2">
            <IndianRupee size={16} className="text-accent" />
            <h2 className="font-display text-lg">How refunds work</h2>
          </div>
          <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
            Online payments are refunded to the original payment method within 5–7 business days (Razorpay processing
            times apply). COD orders are refunded by UPI or bank transfer — we&apos;ll ask for your details over
            email. Shipping charges are refunded when the issue is our mistake.
          </p>
        </section>
      </div>

      <p className="text-xs text-ink/50 mt-10">
        Questions? Check the{' '}
        <Link href="/shipping" className="text-accent underline">
          shipping policy
        </Link>{' '}
        or write to support@vibewallsey.com.
      </p>
    </div>
  );
}
