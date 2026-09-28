'use client';

import { useState, useReducer, useCallback } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/components/cart/CartContext';
import { formatINR } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { LocationPicker } from '@/components/checkout/LocationPicker';

declare global {
  interface Window { Razorpay: any }
}

interface FormState {
  email: string;
  phone: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  payMethod: 'online' | 'cod';
}

type FormAction = {
  type: keyof FormState;
  payload: string;
};

const initialFormState: FormState = {
  email: '',
  phone: '',
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  payMethod: 'online',
};

function formReducer(state: FormState, action: FormAction): FormState {
  return { ...state, [action.type]: action.payload };
}

/** Batch-dispatch several field updates in one React commit. */
function dispatchMultiple(actions: FormAction[]) {
  actions.forEach(dispatchRef.current);
}
const dispatchRef: { current: (a: FormAction) => void } = { current: () => {} };

export default function CheckoutPage() {
  const { items, summary, refresh } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const { show } = useToast();

  const [formState, dispatch] = useReducer(formReducer, {
    ...initialFormState,
    email: session?.user?.email ?? '',
  });
  dispatchRef.current = dispatch;
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
          email: formState.email,
          phone: formState.phone,
          address: { 
            name: formState.name, 
            phone: formState.phone, 
            line1: formState.line1, 
            line2: formState.line2, 
            city: formState.city, 
            state: formState.state, 
            pincode: formState.pincode 
          },
          paymentMethod: formState.payMethod,
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
        name: 'VIBEWALLseyy',
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: { email: formState.email, contact: formState.phone, name: formState.name },
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
      <h1 className="text-3xl lg:text-4xl mt-2 mb-10">Where&apos;s it going?</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <h3 className="text-sm font-semibold mb-4">1. Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <input 
              className="input" 
              placeholder="Email" 
              type="email" 
              value={formState.email} 
              onChange={(e) => dispatch({ type: 'email', payload: e.target.value })} 
              required 
            />
            <input 
              className="input" 
              placeholder="Phone" 
              type="tel" 
              value={formState.phone} 
              onChange={(e) => dispatch({ type: 'phone', payload: e.target.value })} 
              required 
            />
          </div>

          <h3 className="text-sm font-semibold mb-4">2. Shipping address</h3>
          <div className="mb-5">
            <LocationPicker
              onResolved={(p) =>
                dispatchMultiple([
                  { type: 'line1', payload: p.line1 },
                  { type: 'city', payload: p.city },
                  { type: 'state', payload: p.state },
                  { type: 'pincode', payload: p.pincode },
                ])
              }
              onClear={() =>
                dispatchMultiple([
                  { type: 'line1', payload: '' },
                  { type: 'city', payload: '' },
                  { type: 'state', payload: '' },
                  { type: 'pincode', payload: '' },
                ])
              }
            />
          </div>
          <div className="space-y-4 mb-8">
            <input 
              className="input" 
              placeholder="Full name" 
              value={formState.name} 
              onChange={(e) => dispatch({ type: 'name', payload: e.target.value })} 
              required 
            />
            <input 
              className="input" 
              placeholder="Address line 1" 
              value={formState.line1} 
              onChange={(e) => dispatch({ type: 'line1', payload: e.target.value })} 
              required 
            />
            <input 
              className="input" 
              placeholder="Apartment, suite (optional)" 
              value={formState.line2} 
              onChange={(e) => dispatch({ type: 'line2', payload: e.target.value })} 
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input 
                className="input" 
                placeholder="City" 
                value={formState.city} 
                onChange={(e) => dispatch({ type: 'city', payload: e.target.value })} 
                required 
              />
              <input 
                className="input" 
                placeholder="State" 
                value={formState.state} 
                onChange={(e) => dispatch({ type: 'state', payload: e.target.value })} 
                required 
              />
              <input 
                className="input" 
                placeholder="Pincode" 
                value={formState.pincode} 
                onChange={(e) => dispatch({ type: 'pincode', payload: e.target.value })} 
                required 
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold mb-4">3. Payment method</h3>
          <div className="space-y-2">
            <label className={`flex items-center gap-3 border rounded-sm px-4 py-3 text-sm cursor-pointer ${formState.payMethod === 'online' ? 'border-ink' : 'border-line'}`}>
              <input 
                type="radio" 
                name="pay" 
                checked={formState.payMethod === 'online'} 
                onChange={() => dispatch({ type: 'payMethod', payload: 'online' })} 
              />
              UPI / Card / Netbanking / Wallets (via Razorpay)
            </label>
            <label className={`flex items-center gap-3 border rounded-sm px-4 py-3 text-sm cursor-pointer ${formState.payMethod === 'cod' ? 'border-ink' : 'border-line'}`}>
              <input 
                type="radio" 
                name="pay" 
                checked={formState.payMethod === 'cod'} 
                onChange={() => dispatch({ type: 'payMethod', payload: 'cod' })} 
              />
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
            disabled={placing || !formState.email || !formState.phone || !formState.name || !formState.line1 || !formState.city || !formState.state || !formState.pincode}
            className="btn btn-accent w-full mt-6"
          >
            {placing ? 'Placing order...' : formState.payMethod === 'cod' ? 'Place order (COD)' : 'Pay & Place Order'}
          </button>
          <p className="text-xs text-ink/40 mt-3">Payments are processed securely via Razorpay. We never see or store your card details.</p>
        </div>
      </div>
    </div>
  );
}
