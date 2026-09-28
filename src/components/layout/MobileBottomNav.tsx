'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { useWishlist } from '@/components/product/WishlistContext';

const TABS = [
  { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  { href: '/shop', label: 'Shop', icon: LayoutGrid, match: (p: string) => p.startsWith('/shop') || p.startsWith('/product') },
  { href: '/track-order', label: 'Track', icon: Search, match: (p: string) => p.startsWith('/track-order') },
  { href: '/wishlist', label: 'Wishlist', icon: Heart, match: (p: string) => p.startsWith('/wishlist') },
  { href: '/cart', label: 'Cart', icon: ShoppingBag, match: (p: string) => p.startsWith('/cart') || p.startsWith('/checkout') },
];

/**
 * Mobile bottom navigation — HOME · SHOP · TRACK · WISHLIST · CART.
 * Rendered only below `lg`; the desktop header handles navigation above that.
 */
export function MobileBottomNav() {
  const pathname = usePathname() || '/';
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();

  return (
    <nav
      aria-label="Mobile navigation"
      className="glass fixed bottom-0 left-0 right-0 z-40 border-t border-line lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const isCart = tab.href === '/cart';
          const Icon = tab.icon;
          return (
            <button
              key={tab.href}
              type="button"
              onClick={() => {
                if (isCart) {
                  openCart();
                } else {
                  window.location.assign(tab.href);
                }
              }}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] transition-colors ${
                active ? 'text-ink font-semibold' : 'text-ink-secondary'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                {isCart && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-[#171717] text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
                {!isCart && tab.href === '/wishlist' && wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-[#171717] text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </span>
              {tab.label}
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
