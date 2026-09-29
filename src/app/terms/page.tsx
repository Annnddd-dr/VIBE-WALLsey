export const metadata = { title: 'Terms of Service · VIBEWALLseyy' };

const SECTIONS = [
  {
    title: 'The store',
    body: 'VIBEWALLseyy (operating as POSTERraxx) sells art prints and related goods printed to order in India. By placing an order you confirm you are at least 18 years old or using the store under a guardian\'s supervision, and that the details you provide (name, address, phone, email) are accurate.',
  },
  {
    title: 'Orders & pricing',
    body: 'All prices are in Indian Rupees and include what the page says they include. An order is a request to buy; it becomes a contract when we confirm payment (online) or complete the COD confirmation call. In the rare case of a pricing or stock error, we will contact you and you may cancel free of charge. We may refuse or cancel orders that look fraudulent or abusive.',
  },
  {
    title: 'Prints & colour',
    body: 'Posters are printed on archival matte paper with colour-calibrated equipment. Screens show colour differently — slight variation between your display and the print is normal and is not a defect. Sizes refer to standard print formats (A6–A3, Polaroid); stated dimensions have a small production tolerance.',
  },
  {
    title: 'Custom designs',
    body: 'If you upload or approve a custom design, you confirm you own the rights to it. We print it only for you and do not resell customer artwork. Designs that violate law or others\' rights will be cancelled and refunded.',
  },
  {
    title: 'Shipping & risk',
    body: 'Delivery timelines in the shipping policy are good-faith estimates, not guarantees — courier delays outside our control are not grounds for refund, though we will always help trace a parcel. Risk passes to you on delivery.',
  },
  {
    title: 'Returns & refunds',
    body: 'Our refund and remake commitments are described in the Refund Policy, which forms part of these terms.',
  },
  {
    title: 'Governing law',
    body: 'These terms are governed by the laws of India; courts in Bengaluru, Karnataka have exclusive jurisdiction. Contact: support@vibewallsey.com.',
  },
];

export default function TermsPage() {
  return (
    <div className="container-page py-12 lg:py-20 max-w-3xl">
      <p className="eyebrow">Policies</p>
      <h1 className="text-3xl lg:text-4xl mt-2">Terms of Service</h1>
      <p className="text-ink-secondary text-sm mt-3">
        The rules of the store, in sentences a human can read. Last updated: September 2026.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title} className="glass-card rounded-sm p-6">
            <h2 className="font-display text-lg">{s.title}</h2>
            <p className="text-sm text-ink-secondary mt-2 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
