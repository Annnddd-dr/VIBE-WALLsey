'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CartSummaryDTO } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface CartLine {
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    size: string;
    material: string;
    frame: string;
    price: number;
    compareAtPrice: number | null;
    product: { title: string; slug: string; images: { url: string }[] };
  };
}

interface CartCtx {
  items: CartLine[];
  summary: CartSummaryDTO | null;
  isOpen: boolean;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  refresh: () => Promise<void>;
  itemCount: number;
}

const Ctx = createContext<CartCtx | null>(null);

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [summary, setSummary] = useState<CartSummaryDTO | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  const refresh = useCallback(async () => {
    const res = await fetch('/api/cart');
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
    setSummary(data.summary ?? null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true);
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId, quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          show(data.error ?? 'Could not add to cart.', 'error');
          return;
        }
        setItems(data.items ?? []);
        setSummary(data.summary ?? null);
        setIsOpen(true);
        show('Added to cart.');
      } finally {
        setLoading(false);
      }
    },
    [show]
  );

  const updateItem = useCallback(async (variantId: string, quantity: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, quantity }),
      });
      const data = await res.json();
      setItems(data.items ?? []);
      setSummary(data.summary ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(
    async (variantId: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cart?variantId=${variantId}`, { method: 'DELETE' });
        const data = await res.json();
        setItems(data.items ?? []);
        setSummary(data.summary ?? null);
        show('Removed from cart.');
      } finally {
        setLoading(false);
      }
    },
    [show]
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Ctx.Provider
      value={{
        items,
        summary,
        isOpen,
        loading,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        refresh,
        itemCount,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
