export const metadata = { title: 'Privacy Policy · VIBEWALLseyy' };

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'Only what an order needs: your name, contact (email/phone), delivery address, and order history. For online payments we never see or store your card details — Razorpay handles them; we store only the payment reference. If you pick your delivery spot on the map, we store the resolved address, not your live location.',
  },
  {
    title: 'How we use it',
    body: 'To print, ship, and support your order; to send order updates by email/SMS/WhatsApp; to prevent fraud (e.g., verifying the phone number on an account). We do not sell your data, and we do not run third-party ad trackers on this store.',
  },
  {
    title: 'What we share',
    body: 'Your delivery address and phone go to our courier partners to deliver your order. Your email goes to our email provider (transactional order emails only). Payment references go to Razorpay. That is the complete list.',
  },
  {
    title: 'Cookies',
    body: 'We use a short list of essential cookies: your login session, a guest cart ID, and anti-fraud tokens for checkout. No advertising cookies.',
  },
  {
    title: 'Your controls',
    body: 'You can view and edit your saved addresses, delete your account, or ask for a copy of your data by writing to support@vibewallsey.com. We act on deletion requests within 30 days, keeping only what tax law requires us to keep (invoices) with identifiers minimised.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-page py-12 lg:py-20 max-w-3xl">
      <p className="eyebrow">Policies</p>
      <h1 className="text-3xl lg:text-4xl mt-2">Privacy Policy</h1>
      <p className="text-ink-secondary text-sm mt-3">
        Plain language, because your data deserves better than a wall of legalese. Last updated: September 2026.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title} className="glass-card rounded-sm p-6">
            <h2 className="font-display text-lg">{s.title}</h2>
            <p className="text-sm text-ink-secondary mt-2 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>

      <p className="text-xs text-ink/50 mt-10">
        Data requests or questions: support@vibewallsey.com
      </p>
    </div>
  );
}
