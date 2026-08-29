import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      { href: '/shop', label: 'All Posters' },
      { href: '/shop?sort=newest', label: 'New Arrivals' },
      { href: '/shop?sort=bestselling', label: 'Best Sellers' },
      { href: '/custom', label: 'Custom Posters' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/shipping', label: 'Shipping' },
      { href: '/returns', label: 'Returns' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line mt-24 bg-white">
      <div className="container-page py-16 grid grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="col-span-2">
          <div className="font-display text-xl">
            POSTER<span className="text-accent">raxx</span>
          </div>
          <p className="mt-3 text-sm text-ink/60 max-w-xs">
            Premium wall posters, printed and shipped across India. Art that changes your walls.
          </p>
          <p className="mt-4 text-sm text-ink/60">support@posterraxx.com</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-4">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink/70 hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <p className="eyebrow mb-4">Follow</p>
          <ul className="space-y-2">
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-sm text-ink/70 hover:text-ink">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} POSTERraxx. All rights reserved.
      </div>
    </footer>
  );
}
