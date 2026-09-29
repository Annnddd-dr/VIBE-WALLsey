import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All Posters' },
      { href: '/custom-design', label: 'Custom Print' },
      { href: '/shop?sort=bestselling', label: 'People Are Loving' },
      { href: '/shop?sort=newest', label: 'Latest Prints' },
    ],
  },
  {
    title: 'Orders',
    links: [
      { href: '/track-order', label: 'Track Order' },
      { href: '/account/orders', label: 'My Orders' },
      { href: '/account', label: 'Account' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { href: '/shipping', label: 'Shipping Policy' },
      { href: '/returns', label: 'Refund Policy' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line mt-24 bg-surface/60 backdrop-blur-sm">
      <div className="container-page py-16 grid grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="font-display text-xl">
            VIBEWALL<span className="text-accent">seyy</span>
          </div>
          <p className="mt-3 text-sm text-ink/60 max-w-xs">
            Premium wall posters, printed and shipped across India. Art that changes your walls.
          </p>
          <p className="mt-4 text-sm text-ink/60">support@vibewallsey.com</p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-4">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink/70 hover:text-ink transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {col.title === 'Policies' && (
              <ul className="space-y-2 mt-6">
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-ink/70 hover:text-ink transition-colors"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink/40">
        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> VIBEWALLseyy. All rights reserved.
      </div>
    </footer>
  );
}
