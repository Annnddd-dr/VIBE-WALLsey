'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Search, Heart, User, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { SearchOverlay } from './SearchOverlay';

import { useWishlist } from '@/components/product/WishlistContext';

const LINKS = [
  { href: '/shop', label: 'Shop' },
  { href: '/collections', label: 'Collections' },
  { href: '/shop?sort=newest', label: 'New Arrivals' },
  { href: '/shop?sort=bestselling', label: 'Best Sellers' },
  { href: '/custom', label: 'Custom Posters' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-colors duration-300 ${
          scrolled ? 'bg-paper/95 backdrop-blur border-b border-line' : 'bg-transparent'
        }`}
      >
        <nav className="container-page flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="font-display text-xl tracking-tight">
            POSTER<span className="text-accent">raxx</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-ink/80 hover:text-ink transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="hover:opacity-60">
              <Search size={19} />
            </button>
            <Link href="/wishlist" aria-label="Wishlist" className="relative hidden sm:block hover:opacity-60">
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-medium">
                  {wishlistCount}
                </span>
              )}
            </Link>
            {session ? (
              <button onClick={() => signOut()} aria-label="Sign out" className="hidden sm:block hover:opacity-60">
                <User size={19} />
              </button>
            ) : (
              <Link href="/login" aria-label="Account" className="hidden sm:block hover:opacity-60">
                <User size={19} />
              </Link>
            )}
            <button onClick={openCart} aria-label="Open cart" className="relative hover:opacity-60">
              <ShoppingBag size={19} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button className="lg:hidden hover:opacity-60" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden bg-paper border-t border-line px-5 py-4 flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm py-1" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="text-sm py-1" onClick={() => setMobileOpen(false)}>
              Account
            </Link>
          </div>
        )}
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
