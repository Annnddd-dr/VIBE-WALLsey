'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/components/cart/CartContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR } from '@/lib/utils';
import { useState } from 'react';

export default function CartPage() {
  const { items, summary, updateItem, removeItem, loading } = useCart();
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  async function applyCoupon() {
    setCouponMsg(null);
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: coupon }),
    });
    const data = await res.json();
    setCouponMsg(res.ok ? `Coupon applied — you saved ${formatINR(data.summary.discountTotal)}` : data.error);
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState title="YOUR WALL IS WAITING." description="Add something you love." ctaLabel="SHOP POSTERS" ctaHref="/shop" />
      </div>
    );
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <p className="eyebrow">Cart</p>
      <h1 className="text-3xl lg:text-4xl mt-2 mb-10">Your wall, so far.</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 border-b border-line pb-6">
              <div className="relative w-24 h-32 bg-line/40 shrink-0 rounded-sm overflow-hidden">
                {item.variant.product.images[0] && (
                  <Image src={item.variant.product.images[0].url} alt={item.variant.product.title} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.variant.product.title}</p>
                <p className="text-sm text-ink/50 mt-1">{item.variant.size} · Archival Matte</p>
                <p className="text-sm mt-1">{formatINR(item.variant.price)} each</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-line rounded-sm">
                    <button className="p-2" disabled={loading} onClick={() => updateItem(item.variantId, item.quantity - 1)}><Minus size={13} /></button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button className="p-2" disabled={loading} onClick={() => updateItem(item.variantId, item.quantity + 1)}><Plus size={13} /></button>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} className="text-xs text-ink/50 hover:text-accent flex items-center gap-1">
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
              <p className="font-medium">{formatINR(item.variant.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="border border-line rounded-sm p-6 h-fit">
          <h3 className="font-display text-lg mb-4">Order summary</h3>
          <div className="flex gap-2 mb-4">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="input text-sm" />
            <button onClick={applyCoupon} className="btn btn-ghost text-sm shrink-0">Apply</button>
          </div>
          {couponMsg && <p className="text-xs mb-3 text-ink/60">{couponMsg}</p>}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>{formatINR(summary?.subtotal ?? 0)}</span></div>
            {!!summary?.discountTotal && (
              <div className="flex justify-between text-accent"><span>Discount</span><span>−{formatINR(summary.discountTotal)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-ink/60">Shipping</span><span>{summary?.shippingTotal ? formatINR(summary.shippingTotal) : 'Free'}</span></div>
            <div className="flex justify-between font-medium text-base pt-3 border-t border-line mt-2">
              <span>Total</span><span>{formatINR(summary?.total ?? 0)}</span>
            </div>
          </div>
          <Link href="/checkout" className="btn btn-accent w-full mt-6">Go to checkout</Link>
          <p className="text-xs text-ink/40 mt-3">
            Free shipping on orders above ₹{Math.round((summary?.freeShippingThreshold ?? 50000) / 100)}.
          </p>
        </div>
      </div>
    </div>
  );
}
