import { Mail, CreditCard, Truck, Globe, Image as ImageIcon } from 'lucide-react';

export const metadata = { title: 'Settings — VIBEWALLseyy Admin' };

const GROUPS = [
  {
    title: 'Store',
    icon: Globe,
    items: [
      { key: 'NEXT_PUBLIC_SITE_URL', desc: 'Public storefront URL used in emails, sitemap and OG tags.', set: !!process.env.NEXT_PUBLIC_SITE_URL },
      { key: 'NEXT_PUBLIC_SITE_URL (brand)', desc: 'Store name is VIBEWALLseyy — shown across the storefront, emails and invoices.', set: true },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    items: [
      { key: 'RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET', desc: 'Razorpay API keys — required for online checkout.', set: !!process.env.RAZORPAY_KEY_ID },
      { key: 'RAZORPAY_WEBHOOK_SECRET', desc: 'Verifies Razorpay webhook signatures.', set: !!process.env.RAZORPAY_WEBHOOK_SECRET },
      { key: 'NEXT_PUBLIC_RAZORPAY_KEY_ID', desc: 'Public key used by the checkout widget.', set: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID },
    ],
  },
  {
    title: 'Email',
    icon: Mail,
    items: [
      { key: 'RESEND_API_KEY', desc: 'Resend API key for transactional email (verification, resets, receipts).', set: !!process.env.RESEND_API_KEY },
      { key: 'EMAIL_FROM', desc: 'From address, e.g. "VIBEWALLseyy <orders@vibewallsey.com>".', set: !!process.env.EMAIL_FROM },
    ],
  },
  {
    title: 'Media',
    icon: ImageIcon,
    items: [
      { key: 'CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET', desc: 'Cloudinary credentials for image uploads.', set: !!process.env.CLOUDINARY_CLOUD_NAME },
    ],
  },
  {
    title: 'Shipping',
    icon: Truck,
    items: [
      { key: 'FREE_SHIPPING_THRESHOLD_INR', desc: 'Cart value above which shipping is free.', set: !!process.env.FREE_SHIPPING_THRESHOLD_INR },
      { key: 'FLAT_SHIPPING_RATE_INR', desc: 'Flat fee below the free-shipping threshold.', set: !!process.env.FLAT_SHIPPING_RATE_INR },
    ],
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display">Settings</h1>
        <p className="text-xs text-ink/40 mt-1">
          Configuration is environment-driven — values are set on the server, never in the database.
        </p>
      </div>

      <div className="space-y-4">
        {GROUPS.map((g) => (
          <div key={g.title} className="border border-line rounded-sm p-5 bg-surface/50">
            <div className="flex items-center gap-2 mb-4">
              <g.icon size={16} className="text-accent" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">{g.title}</h2>
            </div>
            <div className="space-y-3">
              {g.items.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-ink">{item.key}</p>
                    <p className="text-[11px] text-ink/50 mt-0.5">{item.desc}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5 ${
                      item.set ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {item.set ? 'Configured' : 'Not set'}
                    </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-ink/40 mt-6">
        See <code>.env.example</code> for the full list and setup instructions. Restart the server after
        changing environment variables.
      </p>
    </div>
  );
}
