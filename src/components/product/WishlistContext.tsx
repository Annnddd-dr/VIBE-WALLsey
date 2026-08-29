'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface WishlistContextValue {
  wishlistIds: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'posterraxx_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Initial load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setWishlistIds(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load wishlist from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // 2. Fetch from DB if authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/wishlist')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            setWishlistIds((prev) => {
              // Merge local items with server items
              const combined = Array.from(new Set([...prev, ...data.items]));
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        })
        .catch(() => {});
    }
  }, [status]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlistIds.includes(productId);
    },
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const exists = wishlistIds.includes(productId);
      const next = exists
        ? wishlistIds.filter((id) => id !== productId)
        : [...wishlistIds, productId];

      // Optimistic update
      setWishlistIds(next);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {}

      // Server sync if authenticated
      if (status === 'authenticated') {
        try {
          await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId }),
          });
        } catch (err) {
          console.warn('Wishlist server sync failed', err);
        }
      }
    },
    [wishlistIds, status]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
