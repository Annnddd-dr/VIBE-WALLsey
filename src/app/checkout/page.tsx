'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/components/cart/CartContext';
import { formatINR } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

declare global {
  interface Window { Razorpay: any }
}

export default function CheckoutPage() {
  const { items, summary, refresh } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const { show } = useToast();

  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [payMethod, setPayMethod] = useState<'online' | 'cod'>('online');
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState title="Your cart is empty" description="Add something before checking out." ctaLabel="Browse posters" ctaHref="/shop" />
      </div>
    );
  }

  async function placeOrder() {
    setPlacing(true);
    try {
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone,
          address: { name, phone, line1, line2, city, state, pincode },
          paymentMethod: payMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        show(data.error ?? 'Could not place order.', 'error');
        setPlacing(false);
        return;
      }

      if (data.codConfirmed) {
        await refresh();
        router.push(`/order-confirmed?order=${data.orderNumber}`);
        return;
      }

      if (!data.razorpayKeyId) {
        show('Payments are not configured yet. Add RAZORPAY_KEY_ID to enable checkout.', 'error');
        setPlacing(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: 'INR',
        name: 'POSTERraxx',
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: { email, contact: phone, name },
        theme: { color: '#141414' },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            await refresh();
            router.push(`/order-confirmed?order=${verifyData.orderNumber}`);
          } else {
            show(verifyData.error ?? 'Payment verification failed.', 'error');
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      });
      rzp.open();
    } catch (err) {
      show('Something went wrong. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <p className="eyebrow">Checkout</p>
      <h1 className="text-3xl lg:text-4xl mt-2 mb-10">Where's it going?</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <h3 className="text-sm font-semibold mb-4">1. Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input" placeholder="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <h3 className="text-sm font-semibold mb-4">2. Shipping address</h3>
          <div className="space-y-4 mb-8">
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="input" placeholder="Address line 1" value={line1} onChange={(e) => setLine1(e.target.value)} required />
            <input className="input" placeholder="Apartment, suite (optional)" value={line2} onChange={(e) => setLine2(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input className="input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
              <input className="input" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} required />
              <input className="input" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
            </div>
          </div>

          <h3 className="text-sm font-semibold mb-4">3. Payment method</h3>
          <div className="space-y-2">
            <label className={`flex items-center gap-3 border rounded-sm px-4 py-3 text-sm cursor-pointer ${payMethod === 'online' ? 'border-ink' : 'border-line'}`}>
              <input type="radio" name="pay" checked={payMethod === 'online'} onChange={() => setPayMethod('online')} />
              UPI / Card / Netbanking / Wallets (via Razorpay)
            </label>
            <label className={`flex items-center gap-3 border rounded-sm px-4 py-3 text-sm cursor-pointer ${payMethod === 'cod' ? 'border-ink' : 'border-line'}`}>
              <input type="radio" name="pay" checked={payMethod === 'cod'} onChange={() => setPayMethod('cod')} />
              Cash on Delivery
            </label>
          </div>
        </div>

        <div className="border border-line rounded-sm p-6 h-fit">
          <h3 className="font-display text-lg mb-4">Order summary</h3>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {summary?.lines.map((l) => (
              <div key={l.variantId} className="flex justify-between text-sm">
                <span className="text-ink/70">{l.productTitle} × {l.quantity}</span>
                <span>{formatINR(l.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-line pt-3">
            <div className="flex justify-between"><span className="text-ink/60">Subtotal</span><span>{formatINR(summary?.subtotal ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-ink/60">Shipping</span><span>{summary?.shippingTotal ? formatINR(summary.shippingTotal) : 'Free'}</span></div>
            <div className="flex justify-between font-medium text-base pt-2 border-t border-line mt-2">
              <span>Total</span><span>{formatINR(summary?.total ?? 0)}</span>
            </div>
          </div>
          <button
            onClick={placeOrder}
            disabled={placing || !email || !phone || !name || !line1 || !city || !state || !pincode}
            className="btn btn-accent w-full mt-6"
          >
            {placing ? 'Placing order...' : payMethod === 'cod' ? 'Place order (COD)' : 'Pay & Place Order'}
          </button>
          <p className="text-xs text-ink/40 mt-3">Payments are processed securely via Razorpay. We never see or store your card details.</p>
        </div>
      </div>
    </div>
  );
}
