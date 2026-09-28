import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ArrowRight, Truck, ShieldCheck, Sparkles, PackageCheck, Star } from 'lucide-react';
import { NewsletterForm } from '@/components/marketing/NewsletterForm';

export const revalidate = 60;

export default async function HomePage() {
  const [popular, reviews, reviewCount] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: PRODUCT_CARD_INCLUDE,
      orderBy: [{ bestSeller: 'desc' }, { ratingAvg: 'desc' }],
      take: 8,
    }),
    prisma.review.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 9,
      include: {
        user: { select: { name: true } },
        product: { select: { title: true, slug: true } },
      },
    }),
    prisma.review.count({ where: { status: 'APPROVED' } }),
  ]);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="container-page pt-16 pb-20 lg:pt-24 lg:pb-28 relative z-10">
          <div className="mx-auto max-w-5xl text-center">
            <p className="eyebrow animate-fade-up">Premium wall posters · Made in India</p>
            <h1
              className="mt-5 text-4xl sm:text-6xl lg:text-8xl max-w-4xl mx-auto animate-fade-up"
              style={{ animationDelay: '0.1s' }}
            >
              MAKE YOUR WALL
              <br />
              FEEL LIKE YOU.
            </h1>
            <p
              className="mt-6 text-lg sm:text-xl text-ink-secondary max-w-2xl mx-auto animate-fade-up"
              style={{ animationDelay: '0.2s' }}
            >
              Premium posters designed for your room, your mood and your story.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/shop" className="btn btn-primary">
                SHOP POSTERS
              </Link>
              <Link href="/track-order" className="btn btn-ghost">
                TRACK YOUR ORDER
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PEOPLE ARE LOVING ============ */}
      {popular.length > 0 && (
        <section className="container-page py-16 lg:py-24">
          <div className="mb-10">
            <p className="eyebrow">Popular right now</p>
            <h2 className="text-3xl lg:text-4xl mt-2">PEOPLE ARE LOVING</h2>
          </div>
          <ProductGrid products={popular.map(toCardData)} />
        </section>
      )}

      {/* ============ HOW IT WORKS ============ */}
      <section className="relative py-16 lg:py-24">
        <div className="container-page">
          <div className="text-center mb-14">
            <p className="eyebrow">From studio to wall</p>
            <h2 className="text-3xl lg:text-4xl mt-2">How it works</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '🖼️', title: 'CHOOSE', desc: 'Pick a print that speaks to you and your space.' },
              { icon: '🎨', title: 'CUSTOMIZE', desc: 'Select size, paper and framing to make it yours.' },
              { icon: '🖨️', title: 'PRINT', desc: 'Giclée archival ink on museum-grade paper, colour-calibrated.' },
              { icon: '📦', title: 'DELIVER', desc: 'Rigid packaging, tracked courier, straight to your wall.' },
            ].map((s, i) => (
              <div
                key={s.title}
                className="text-center animate-fade-up"
                style={{ animationDelay: `${0.15 * i}s` }}
              >
                <div className="mx-auto w-14 h-14 rounded-full border border-line bg-surface flex items-center justify-center text-2xl">
                  {s.icon}
                </div>
                <h3 className="mt-4 text-sm font-semibold tracking-[0.18em]">{s.title}</h3>
                <p className="mt-2 text-xs text-ink-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ REAL REVIEWS ============ */}
      {reviews.length > 0 && (
        <section className="container-page py-16 lg:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow">Reviews</p>
              <h2 className="text-3xl lg:text-4xl mt-2">WHAT CUSTOMERS SAY</h2>
            </div>
            <p className="hidden sm:block text-sm text-ink-secondary">
              {reviewCount} verified reviews across the store
            </p>
          </div>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {reviews.map((r) => (
              <figure
                key={r.id}
                className="mb-4 break-inside-avoid rounded-sm border border-line bg-surface p-5"
              >
                <div className="flex items-center gap-0.5 text-accent" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill={i < r.rating ? 'currentColor' : 'none'} strokeWidth={i < r.rating ? 0 : 1.5} className={i < r.rating ? '' : 'text-line'} />
                  ))}
                </div>
                {r.title && <p className="mt-3 text-sm font-semibold">{r.title}</p>}
                <blockquote className="mt-2 text-sm text-ink-secondary leading-relaxed">{r.body}</blockquote>
                <figcaption className="mt-4 flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {r.user.name ?? 'Verified buyer'}
                    {r.verifiedPurchase && (
                      <span className="ml-2 text-[10px] tracking-wider text-accent">✓ VERIFIED PURCHASE</span>
                    )}
                  </span>
                  <Link href={`/product/${r.product.slug}`} className="text-ink/40 hover:text-accent transition-colors truncate max-w-[40%]">
                    {r.product.title}
                  </Link>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ============ WHY US ============ */}
      <section className="container-page py-16 lg:py-24">
        <p className="eyebrow">Why VIBEWALLseyy</p>
        <h2 className="text-3xl lg:text-4xl mt-2 mb-12">Premium, down to the paper.</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Sparkles, title: 'Archival printing', desc: 'Fade-resistant, colour-accurate ink on premium stock.' },
            { icon: PackageCheck, title: 'Carefully packed', desc: 'Rigid mailers so prints arrive flat, never bent.' },
            { icon: Truck, title: 'Fast shipping', desc: 'Dispatched within 24–48 hours, tracked door to door.' },
            { icon: ShieldCheck, title: 'Secure checkout', desc: 'UPI, cards & COD — payments handled by Razorpay.' },
          ].map((f) => (
            <div key={f.title}>
              <f.icon size={22} className="text-accent" />
              <h3 className="mt-4 text-base font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-secondary">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="container-page py-16">
        <div className="glass-card rounded-sm py-14 px-6 text-center max-w-lg mx-auto">
          <h2 className="text-2xl lg:text-3xl">Get first access to new prints.</h2>
          <p className="mt-2 text-sm text-ink-secondary">Join the list — new drops, restocks, and studio notes.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
