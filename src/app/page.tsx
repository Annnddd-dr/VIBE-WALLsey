import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ArrowRight, Truck, ShieldCheck, Sparkles, PackageCheck } from 'lucide-react';
import { NewsletterForm } from '@/components/marketing/NewsletterForm';

export const revalidate = 60;

const COLLECTIONS = [
  { slug: 'anime', label: 'Anime', span: 'lg:col-span-2 lg:row-span-2' },
  { slug: 'movies', label: 'Movies', span: '' },
  { slug: 'music', label: 'Music', span: '' },
  { slug: 'cars', label: 'Cars', span: '' },
  { slug: 'minimal', label: 'Minimal', span: '' },
  { slug: 'gaming', label: 'Gaming', span: '' },
  { slug: 'typography', label: 'Typography', span: '' },
];

const ROOMS = ['Bedroom', 'Living Room', 'Study', 'Gaming Room', 'Office'];

export default async function HomePage() {
  const [bestSellers, newArrivals] = await Promise.all([
    prisma.product.findMany({ where: { status: 'ACTIVE', bestSeller: true }, include: PRODUCT_CARD_INCLUDE, take: 8 }),
    prisma.product.findMany({ where: { status: 'ACTIVE', newArrival: true }, include: PRODUCT_CARD_INCLUDE, take: 8, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-charcoal text-paper">
        <div className="container-page py-24 lg:py-36 relative z-10">
          <p className="eyebrow text-paper/70 animate-fade-up">Premium wall art, made for India</p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl mt-4 max-w-3xl animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Art that changes your walls.
          </h1>
          <p className="mt-6 text-paper/70 max-w-md text-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Premium posters designed to make your space feel like yours.
          </p>
          <div className="mt-8 flex gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/shop" className="btn bg-paper text-ink hover:bg-paper/90">Shop Posters</Link>
            <Link href="/collections" className="btn border border-paper/30 text-paper hover:border-paper">Explore Collections</Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block opacity-90">
          <div className="grid grid-cols-2 gap-4 h-full p-10">
            <div className="bg-line/20 rounded-sm mt-12" style={{ aspectRatio: '3/4' }} />
            <div className="bg-line/30 rounded-sm -mt-6" style={{ aspectRatio: '3/4' }} />
          </div>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow">Collections</p>
            <h2 className="text-3xl lg:text-4xl mt-2">Find your wall's next print.</h2>
          </div>
          <Link href="/collections" className="hidden sm:flex items-center gap-1 text-sm hover:text-accent">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:auto-rows-[180px]">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className={`relative group overflow-hidden rounded-sm bg-line/40 flex items-end p-5 ${c.span}`}
              style={{ minHeight: 180 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />
              <span className="relative z-10 text-paper font-display text-xl">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="container-page py-20 lg:py-28">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow">Best sellers</p>
              <h2 className="text-3xl lg:text-4xl mt-2">The most-loved prints.</h2>
            </div>
          </div>
          <ProductGrid products={bestSellers.map(toCardData)} />
        </section>
      )}

      <section className="bg-white border-y border-line py-20 lg:py-28">
        <div className="container-page">
          <p className="eyebrow">Shop by room</p>
          <h2 className="text-3xl lg:text-4xl mt-2 mb-10">Curated for every corner.</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {ROOMS.map((room) => (
              <Link key={room} href={`/shop?room=${encodeURIComponent(room)}`} className="border border-line rounded-sm py-10 text-center text-sm hover:border-ink transition-colors">
                {room}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="container-page py-20 lg:py-28">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow">Just dropped</p>
              <h2 className="text-3xl lg:text-4xl mt-2">New arrivals.</h2>
            </div>
          </div>
          <ProductGrid products={newArrivals.map(toCardData)} />
        </section>
      )}

      <section className="bg-charcoal text-paper py-24">
        <div className="container-page max-w-2xl">
          <p className="eyebrow text-paper/70">Our story</p>
          <h2 className="text-3xl lg:text-4xl mt-3">Printed with intention, not mass-produced.</h2>
          <p className="mt-5 text-paper/70 leading-relaxed">
            POSTERraxx started with a simple frustration: most posters sold in India were either cheap, low-resolution
            prints or absurdly overpriced imports. We build every print in-house, on archival-grade paper, colour
            calibrated for accuracy — so what you see on screen is exactly what lands on your wall.
          </p>
        </div>
      </section>

      <section className="container-page py-20 lg:py-28">
        <p className="eyebrow">Why POSTERraxx</p>
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
              <p className="mt-1.5 text-sm text-ink/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-line/30 py-20">
        <div className="container-page text-center max-w-lg mx-auto">
          <h2 className="text-2xl lg:text-3xl">Get first access to new drops.</h2>
          <p className="mt-2 text-ink/60 text-sm">Join the list — new collections, restocks, and offers.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
