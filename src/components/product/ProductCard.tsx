'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useState, memo } from 'react';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { useCart } from '@/components/cart/CartContext';
import { useWishlist } from '@/components/product/WishlistContext';

export interface ProductCardData {
  id?: string;
  slug: string;
  title: string;
  images: { url: string }[];
  minPrice: number;
  compareAtPrice: number | null;
  ratingAvg: number;
  ratingCount: number;
  bestSeller?: boolean;
  newArrival?: boolean;
  defaultVariantId?: string;
}

function ProductCardContent({ product }: { product: ProductCardData }) {
  const [hovered, setHovered] = useState(false);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const productId = product.id || product.slug;
  const isFavorited = isInWishlist(productId);

  return (
    <div className="group" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link href={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-line/30 rounded-sm">
        {product.images[0] && (
          <Image
            src={hovered && product.images[1] ? product.images[1].url : product.images[0].url}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            placeholder="empty"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.bestSeller && <Badge tone="accent">Bestseller</Badge>}
          {product.newArrival && <Badge tone="muted">New</Badge>}
        </div>
        <button
          type="button"
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(productId);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all ${
            isFavorited
              ? 'bg-white text-red-500 shadow-md opacity-100'
              : 'bg-paper/90 text-ink/60 hover:text-ink opacity-0 group-hover:opacity-100 hover:scale-110'
          }`}
        >
          <Heart size={15} className={isFavorited ? 'fill-red-500 text-red-500' : ''} />
        </button>
        {product.defaultVariantId && (
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product.defaultVariantId!);
            }}
            className="absolute bottom-0 left-0 right-0 bg-ink text-paper text-xs py-2.5 text-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Quick add
          </button>
        )}
      </Link>
      <Link href={`/product/${product.slug}`} className="block mt-3">
        <p className="text-sm text-ink truncate">{product.title}</p>
        <div className="flex items-center justify-between mt-1">
          <PriceDisplay price={product.minPrice} compareAt={product.compareAtPrice} />
          {product.ratingCount > 0 && <Rating value={product.ratingAvg} count={product.ratingCount} size={11} />}
        </div>
      </Link>
    </div>
  );
}

// Memoize ProductCard to prevent re-renders when parent updates
export const ProductCard = memo(ProductCardContent);
