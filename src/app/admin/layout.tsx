import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  BarChart3,
  FolderTree,
  Star,
  Truck,
  Settings,
  Sparkles,
  Bell,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { AdminModeSwitcher } from '@/components/admin/AdminModeSwitcher';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/shipping', label: 'Shipping', icon: Truck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user) redirect('/admin-login');
  if (!hasRole(role, 'STAFF')) redirect('/admin-login?error=unauthorized');

  return (
    <div className="admin-shell min-h-screen relative overflow-hidden admin-light">
      <div className="admin-orb orb-1" />
      <div className="admin-orb orb-2" />
      <div className="admin-orb orb-3" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="admin-sidebar hidden w-72 shrink-0 flex-col border-r border-white/10 p-6 md:flex">
          <div className="mb-10 flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_30px_rgba(62,124,79,0.25)]">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-display text-xl leading-none text-ink">
                  VIBEWALL<span className="text-accent">seyy</span>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-ink/45">Admin</div>
              </div>
            </Link>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-600">
              Live
            </span>
          </div>

          <nav className="space-y-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="admin-nav-link group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-ink/75 transition-all duration-200 hover:border-accent/20 hover:bg-white/5 hover:text-ink"
              >
                <span className="flex items-center gap-3">
                  <item.icon size={16} className="text-accent/80 transition-transform duration-200 group-hover:scale-110" />
                  {item.label}
                </span>
                <ArrowUpRight size={14} className="text-ink/20 transition-all duration-200 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-black/5 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-ink/45">
              <span>Operator</span>
              <span className="rounded-full bg-accent/10 px-2 py-1 text-[9px] text-accent">{role}</span>
            </div>
            <div className="mt-3 text-sm font-medium text-ink">{session.user.email}</div>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink/55">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              Portal online
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-white/10 px-6 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-black/5 p-2 md:hidden">
                  <Sparkles className="text-accent" size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-ink/45">Premium workspace</p>
                  <h1 className="font-display text-2xl text-ink">Operations control</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/5 px-3 py-2 text-sm text-ink/60 md:flex">
                  <Search size={14} />
                  <span>Search studio</span>
                </div>
                <button className="rounded-full border border-accent/25 bg-accent/10 p-2.5 text-accent transition hover:scale-105 hover:bg-accent/15">
                  <Bell size={16} />
                </button>
                <AdminModeSwitcher />
                <div className="rounded-full border border-white/10 bg-black/5 px-3 py-2 text-sm font-medium text-ink">
                  {session.user.email?.split('@')[0]}
                </div>
              </div>
            </div>
          </header>

          <main className="p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
