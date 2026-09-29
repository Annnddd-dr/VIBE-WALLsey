'use client';

import Link from 'next/link';
import { useEffect, useState, memo, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Search, Heart, User, ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { SearchOverlay } from './SearchOverlay';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useWishlist } from '@/components/product/WishlistContext';

const LINKS = [
  { href: '/shop', label: 'SHOP' },
  { href: '/custom-design', label: 'CUSTOM PRINT' },
  { href: '/track-order', label: 'TRACK ORDER' },
];

function NavbarContent() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { wishlistCount } = useWishlist();
  const { data: session } = useSession();
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttled scroll listener: transparent over the atmosphere,
  // frosted glass once the user scrolls.
  useEffect(() => {
    const onScroll = () => {
      if (scrollTimeoutRef.current) return;
      scrollTimeoutRef.current = setTimeout(() => {
        setScrolled(window.scrollY > 24);
        scrollTimeoutRef.current = null;
      }, 50);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-30 transition-all duration-500 ${
          scrolled ? 'glass border-b border-line shadow-glass' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="container-page flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="font-display text-xl tracking-tight">
            VIBEWALL<span className="text-accent">seyy</span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-medium tracking-[0.14em] text-ink/70 hover:text-ink transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3.5">
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="hover:opacity-60">
              <Search size={19} />
            </button>
            <Link href="/wishlist" aria-label="Wishlist" className="relative hidden sm:block hover:opacity-60">
              <Heart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-accent text-[#171717] text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-medium">
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
                <span className="absolute -top-2 -right-2 bg-accent text-[#171717] text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <ThemeToggle />
            <button className="lg:hidden hover:opacity-60" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <div className="glass lg:hidden border-t border-line px-5 py-4 flex flex-col gap-3 pb-24">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm py-1 tracking-[0.12em] font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/account" className="text-sm py-1" onClick={() => setMobileOpen(false)}>
              Account
            </Link>
            <Link href="/about" className="text-sm py-1" onClick={() => setMobileOpen(false)}>
              About
            </Link>
          </div>
        )}
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

// Memoize Navbar to prevent re-renders from parent updates
export const Navbar = memo(NavbarContent);
