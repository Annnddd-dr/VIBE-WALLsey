import Link from 'next/link';
import { ArrowUpRight, LockKeyhole, Sparkles } from 'lucide-react';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="admin-shell admin-light relative min-h-screen overflow-hidden">
      <div className="admin-orb orb-1" />
      <div className="admin-orb orb-2" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Link href="/admin-login" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <Sparkles size={18} />
            </span>
            <span className="font-display text-lg text-ink">
              VIBEWALL<span className="text-accent">seyy</span>
              <span className="mt-0.5 block font-sans text-[9px] uppercase tracking-[0.28em] text-ink/45">
                Admin portal
              </span>
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-ink/55 transition hover:text-ink">
            Main website <ArrowUpRight size={15} />
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1fr_0.8fr]">
          <section className="max-w-xl">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-accent">
              <LockKeyhole size={14} /> Staff access only
            </p>
            <h1 className="mt-5 font-display text-5xl leading-tight text-ink sm:text-6xl">
              The studio behind every wall.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-ink/60">
              Manage the VIBEWALLseyy store, fulfilment, customers, and campaigns from one secure workspace.
            </p>
            <div className="mt-9 flex flex-wrap gap-2 text-xs text-ink/65">
              {['Orders', 'Catalog', 'Customers', 'Analytics'].map((feature) => (
                <span key={feature} className="rounded-full border border-white/30 bg-white/20 px-3 py-2 backdrop-blur-sm">
                  {feature}
                </span>
              ))}
            </div>
          </section>

          <section className="admin-card w-full rounded-[28px] p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.28em] text-ink/45">Secure workspace</p>
            <h2 className="mt-2 font-display text-3xl text-ink">Admin sign in</h2>
            <p className="mb-7 mt-2 text-sm text-ink/55">Use your staff account to continue.</p>
            <AdminLoginForm unauthorized={searchParams.error === 'unauthorized'} />
            <p className="mt-5 text-center text-xs leading-5 text-ink/45">
              Access is limited to approved staff accounts.
            </p>
          </section>
        </div>

        <footer className="flex justify-between border-t border-black/5 pt-4 text-[10px] uppercase tracking-[0.2em] text-ink/40">
          <span>VIBEWALLseyy operations</span>
          <span>Private portal</span>
        </footer>
      </main>
    </div>
  );
}