import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, BarChart3 } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user) redirect('/login');
  if (!hasRole(role, 'STAFF')) redirect('/');

  return (
    <div className="min-h-screen bg-paper flex">
      <aside className="w-56 border-r border-line hidden md:flex flex-col p-6 shrink-0">
        <Link href="/admin" className="font-display text-lg mb-10">
          POSTER<span className="text-accent">raxx</span> <span className="text-xs text-ink/40 block font-sans">Admin</span>
        </Link>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm hover:bg-line/50">
              <item.icon size={16} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-ink/40">
          Signed in as {session.user.email} · {role}
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10 overflow-x-auto">{children}</main>
    </div>
  );
}
