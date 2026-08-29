'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/components/cart/CartContext';
import { WishlistProvider } from '@/components/product/WishlistContext';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </SessionProvider>
  );
}

