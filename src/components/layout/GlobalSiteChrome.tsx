'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/components/cart/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AtmosphericBackground } from '@/components/background/AtmosphericBackground';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { WishlistProvider } from '@/components/product/WishlistContext';

export function GlobalSiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isAdminPortal =
    pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/admin-login';

  if (isAdminPortal) return children;

  return (
    <WishlistProvider>
      <CartProvider>
        <AtmosphericBackground />
        <Navbar />
        <main className="relative z-10">{children}</main>
        <Footer />
        <CartDrawer />
        <MobileBottomNav />
      </CartProvider>
    </WishlistProvider>
  );
}