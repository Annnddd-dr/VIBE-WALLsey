'use client';

import { useEffect, useState } from 'react';
import { useWishlist } from '@/components/product/WishlistContext';
import { ProductCard, ProductCardData } from '@/components/product/ProductCard';
import { Heart, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlistIds, wishlistCount } = useWishlist();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/wishlist/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: wishlistIds }),
    })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  return (
    <div className="container-page py-10 lg:py-16">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="eyebrow">Saved Prints</p>
          <h1 className="text-3xl lg:text-4xl font-display mt-2">Your Wishlist</h1>
        </div>
        <span className="text-xs text-ink/50">
          {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink/40">
          <Loader2 size={24} className="animate-spin mb-3 text-accent" />
          <p className="text-xs">Loading saved posters...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-line rounded-sm bg-surface/60 max-w-md mx-auto p-8">
          <div className="w-12 h-12 rounded-full bg-line/30 flex items-center justify-center mx-auto mb-4 text-ink/30">
            <Heart size={20} />
          </div>
          <h2 className="text-lg font-display text-ink mb-1">SAVE WHAT SPEAKS TO YOU.</h2>
          <p className="text-xs text-ink/50 leading-relaxed mb-6">
            Tap the heart on any poster while browsing to save it here for later.
          </p>
          <Link href="/shop" className="btn btn-primary text-xs gap-2 inline-flex">
            <ShoppingBag size={14} />
            EXPLORE POSTERS <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
