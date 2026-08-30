'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartContext';
import { formatINR } from '@/lib/utils';
import { memo, useMemo } from 'react';

// Memoized cart item row component
const CartItemRow = memo(function CartItemRow({ 
  item, 
  loading,
  onUpdate,
  onRemove 
}: any) {
  return (
    <div className="flex gap-3">
      <div className="relative w-20 h-24 bg-line/40 shrink-0 overflow-hidden rounded-sm">
        {item.variant.product.images[0] && (
          <Image
            src={item.variant.product.images[0].url}
            alt={item.variant.product.title}
            fill
            loading="lazy"
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.variant.product.title}</p>
        <p className="text-xs text-ink/50 mt-0.5">
          {item.variant.size} · {item.variant.material} · {item.variant.frame}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-line rounded-sm">
            <button
              className="p-1.5 disabled:opacity-30"
              disabled={loading}
              onClick={() => onUpdate(item.variantId, item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              <Minus size={12} />
            </button>
            <span className="px-2 text-sm">{item.quantity}</span>
            <button
              className="p-1.5 disabled:opacity-30"
              disabled={loading}
              onClick={() => onUpdate(item.variantId, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus size={12} />
            </button>
          </div>
          <span className="text-sm font-medium">{formatINR(item.variant.price * item.quantity)}</span>
        </div>
      </div>
      <button
        onClick={() => onRemove(item.variantId)}
        aria-label="Remove item"
        className="p-1 h-fit text-ink/40 hover:text-accent"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
});

function CartDrawerContent() {
  const { isOpen, closeCart, items, summary, updateItem, removeItem, loading } = useCart();

  // Memoize cart items rendering to prevent re-renders
  const cartItemsList = useMemo(() => {
    return items.map((item) => (
      <CartItemRow 
        key={item.variantId} 
        item={item}
        loading={loading}
        onUpdate={updateItem}
        onRemove={removeItem}
      />
    ));
  }, [items, loading, updateItem, removeItem]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 z-40"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-paper z-50 flex flex-col shadow-2xl"
            role="dialog"
            aria-label="Shopping cart"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h2 className="font-display text-lg">Your cart {items.length > 0 && `(${items.length})`}</h2>
              <button onClick={closeCart} aria-label="Close cart" className="p-1 hover:opacity-60">
                <X size={20} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <p className="text-ink/60">Your cart is empty.</p>
                <Link href="/shop" onClick={closeCart} className="btn btn-primary mt-5">
                  Browse posters
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                  {cartItemsList}
                </div>

                <div className="border-t border-line px-6 py-5 space-y-2">
                  {summary && summary.shippingTotal > 0 && (
                    <p className="text-xs text-ink/60 bg-line/40 rounded-sm px-3 py-2">
                      Add {formatINR(Math.max(0, 149900 - summary.subtotal))} more for free shipping.
                    </p>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/60">Subtotal</span>
                    <span>{formatINR(summary?.subtotal ?? 0)}</span>
                  </div>
                  {!!summary?.discountTotal && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>Discount</span>
                      <span>−{formatINR(summary.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/60">Shipping</span>
                    <span>{summary?.shippingTotal ? formatINR(summary.shippingTotal) : 'Free'}</span>
                  </div>
                  <div className="flex justify-between font-medium text-base pt-2 border-t border-line mt-2">
                    <span>Total</span>
                    <span>{formatINR(summary?.total ?? 0)}</span>
                  </div>
                  <Link href="/checkout" onClick={closeCart} className="btn btn-accent w-full mt-3">
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// Memoize CartDrawer to prevent re-renders from parent updates
export const CartDrawer = memo(CartDrawerContent);
