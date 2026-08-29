import Link from 'next/link';

const LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/wishlist', label: 'Wishlist' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
        <nav className="flex lg:flex-col gap-4 lg:gap-2 overflow-x-auto">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-ink/70 hover:text-ink whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
