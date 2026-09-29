import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProductGallery } from '@/components/product/ProductGallery';
import { VariantSelector } from '@/components/product/VariantSelector';
import { Accordion } from '@/components/product/Accordion';
import { Rating } from '@/components/ui/Rating';
import { ProductGrid } from '@/components/product/ProductGrid';
import { PRODUCT_CARD_INCLUDE, toCardData } from '@/lib/catalog';
import { getShippingRates } from '@/lib/store-settings';
import { ReviewForm } from '@/components/product/ReviewForm';
import { PincodeEstimator } from '@/components/product/PincodeEstimator';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  return {
    title: product.seoTitle ?? product.title,
    description: product.seoDescription ?? product.description.slice(0, 155),
    openGraph: { title: product.title, description: product.description.slice(0, 155) },
  };
}

export default async function ProductPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user);

  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: { where: { isActive: true }, include: { inventory: true } },
      category: true,
      reviews: { where: { status: 'APPROVED' }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: true } },
    },
  });

  if (!product) notFound();

  const shippingRates = await getShippingRates();

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, status: 'ACTIVE' },
    include: PRODUCT_CARD_INCLUDE,
    take: 4,
  });

  const variantLites = product.variants.map((v) => ({
    id: v.id,
    size: v.size,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    stock: (v.inventory?.stock ?? 0) - (v.inventory?.reserved ?? 0),
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images[0]?.url,
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: Math.min(...variantLites.map((v) => v.price)) / 100,
      highPrice: Math.max(...variantLites.map((v) => v.price)) / 100,
      priceCurrency: 'INR',
      availability: variantLites.some((v) => v.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: product.ratingCount > 0 ? { '@type': 'AggregateRating', ratingValue: product.ratingAvg, reviewCount: product.ratingCount } : undefined,
  };

  return (
    <div className="container-page py-10 lg:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav className="text-xs text-ink/50 mb-8">
        <a href="/shop" className="hover:text-ink">Shop</a> / <a href={`/shop?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</a> / <span className="text-ink">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <ProductGallery images={product.images} title={product.title} />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-ink/40">Archival 300 GSM Print</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl lg:text-3xl font-display">{product.title}</h1>
          {product.ratingCount > 0 && (
            <div className="mt-2">
              <Rating value={product.ratingAvg} count={product.ratingCount} />
            </div>
          )}
          <p className="mt-4 text-sm text-ink/60 leading-relaxed">{product.description}</p>

          <div className="mt-8">
            <VariantSelector variants={variantLites} />
          </div>

          <div className="mt-6">
            <PincodeEstimator />
          </div>

          <div className="mt-10">
            <Accordion
              items={[
                { title: 'Description', content: product.description },
                { title: 'Paper', content: 'Printed on archival-grade 300 GSM matte poster paper with pigment ink — colours stay true for decades, zero glare under room lighting.' },
                { title: 'Dimensions', content: 'Choose from Polaroid, A6, A5, A4 or A3 — exact millimetre dimensions are shown next to each size option above.' },
                { title: 'Shipping', content: `Dispatched within 24–48 hours. Delivery in 3–7 business days across India. Free shipping on orders of ₹${Math.round(shippingRates.freeShippingThreshold)} or more.` },
                { title: 'Returns', content: '7-day returns on unused, unopened prints.' },
                { title: 'Care Instructions', content: 'Keep away from direct sunlight and moisture. Wipe gently with a dry cloth.' },
              ]}
            />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <p className="eyebrow">Complete the wall</p>
          <h2 className="text-2xl lg:text-3xl mt-2 mb-8">You might also like</h2>
          <ProductGrid products={related.map(toCardData)} />
        </section>
      )}

      <section className="mt-24 max-w-2xl">
        <p className="eyebrow">Reviews</p>
        <h2 className="text-2xl lg:text-3xl mt-2 mb-8">Customer Reviews</h2>

        <div className="mb-8">
          <ReviewForm productId={product.id} isLoggedIn={isLoggedIn} />
        </div>

        {product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((r) => (
              <div key={r.id} className="border-b border-line pb-6">
                <div className="flex items-center gap-2">
                  <Rating value={r.rating} size={13} />
                  {r.verifiedPurchase && <span className="text-[10px] uppercase text-accent tracking-wide font-semibold">Verified Purchase</span>}
                </div>
                {r.title && <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>}
                <p className="mt-1 text-sm text-ink/70 leading-relaxed">{r.body}</p>
                <p className="mt-2 text-xs text-ink/40">{r.user.name ?? 'Anonymous Customer'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink/40 italic">No reviews yet. Be the first to review this poster!</p>
        )}
      </section>
    </div>
  );
}
