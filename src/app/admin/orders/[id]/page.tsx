import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { formatINR } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Tag,
  ShoppingBag,
  User,
  Phone,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import { StatusManager } from '../StatusManager';
import { ShipmentForm } from '../ShipmentForm';

const FULFILLMENT_STEPS: { key: string; label: string; icon: any }[] = [
  { key: 'PENDING', label: 'Placed', icon: Clock },
  { key: 'PAID', label: 'Paid', icon: CreditCard },
  { key: 'PRINTING', label: 'Printing', icon: Package },
  { key: 'PACKED', label: 'Packed', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle2 },
];

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  PENDING: 0,
  PAYMENT_PENDING: 0,
  PAID: 1,
  PROCESSING: 2,
  PRINTING: 2,
  PACKED: 3,
  SHIPPED: 4,
  OUT_FOR_DELIVERY: 4,
  DELIVERED: 5,
  CANCELLED: -1,
  REFUNDED: -1,
  RETURN_REQUESTED: -1,
  RETURNED: -1,
};

export const metadata = { title: 'Order Detail — POSTERraxx Admin' };

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) redirect('/admin');

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: { orderBy: { position: 'asc' as const }, take: 1 } },
              },
            },
          },
        },
      },
      address: true,
      payment: true,
      shipment: true,
      coupon: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!order) notFound();

  const currentStep = STATUS_PROGRESS[order.status] ?? 0;
  const isCancelled = currentStep === -1;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to all orders
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display">{order.orderNumber}</h1>
            <p className="text-xs text-ink/50 mt-1">
              Placed {format(order.createdAt, 'dd MMM yyyy, h:mm a')} · Updated{' '}
              {format(order.updatedAt, 'dd MMM, h:mm a')}
            </p>
          </div>
          <span className="text-xs uppercase tracking-wider font-semibold bg-ink text-white px-3 py-2 rounded-sm">
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Status & Fulfillment */}
      <div className="border border-line rounded-sm p-6 bg-white mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/50">
            Fulfillment Status
          </h2>
          <StatusManager orderId={order.id} status={order.status} />
        </div>

        {!isCancelled ? (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {FULFILLMENT_STEPS.map((step, idx) => {
              const isCompleted = currentStep > idx;
              const isCurrent = currentStep === idx;
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-accent text-white ring-4 ring-accent/20'
                        : 'bg-line/40 text-ink/30'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : <StepIcon size={16} />}
                  </div>
                  <p
                    className={`text-[11px] leading-tight ${
                      isCurrent ? 'font-semibold text-ink' : isCompleted ? 'text-ink/80' : 'text-ink/40'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-red-200 bg-red-50 p-4 rounded-sm flex items-center gap-3 text-xs text-red-700">
            <AlertCircle size={16} />
            <span>This order is {order.status.toLowerCase().replace(/_/g, ' ')}.</span>
          </div>
        )}

        {order.shipment?.trackingNumber && (
          <div className="mt-5 pt-5 border-t border-line/60 flex items-center justify-between text-xs">
            <span className="text-ink/60">
              Courier: <strong>{order.shipment.provider || '—'}</strong>
            </span>
            <span className="font-mono text-ink">
              Tracking: <strong>{order.shipment.trackingNumber}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="border border-line rounded-sm overflow-hidden bg-white mb-6">
        <div className="px-6 py-4 border-b border-line bg-line/20 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/60">
            <span className="inline-flex items-center gap-1.5">
              <ShoppingBag size={13} /> Items ({order.items.length})
            </span>
          </h2>
          <span className="text-xs text-ink/50">
            {order.items.reduce((n, i) => n + i.quantity, 0)} units
          </span>
        </div>
        <div className="divide-y divide-line">
          {order.items.map((item) => {
            const heroImage = item.variant?.product?.images[0]?.url;
            return (
              <div key={item.id} className="p-5 flex items-center gap-4">
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage}
                    alt={item.productTitle}
                    className="w-14 h-16 object-cover rounded-sm border border-line shrink-0"
                  />
                ) : (
                  <div className="w-14 h-16 bg-line/40 rounded-sm flex items-center justify-center text-ink/20 text-xs shrink-0">
                    Art
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-ink truncate">{item.productTitle}</h3>
                  <p className="text-xs text-ink/50 mt-0.5">{item.variantLabel}</p>
                  <p className="text-xs text-ink/40 mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">{formatINR(item.lineTotal)}</p>
                  {item.quantity > 1 && (
                    <p className="text-[11px] text-ink/40">{formatINR(item.unitPrice)} each</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Customer */}
        <div className="border border-line rounded-sm p-5 bg-white">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
            <User size={14} className="text-accent" />
            <span>Customer</span>
          </div>
          <div className="text-xs text-ink/70 space-y-1.5">
            <p className="font-semibold text-ink">{order.user?.name ?? order.email}</p>
            <p className="flex items-center gap-1.5">
              <Mail size={12} className="text-ink/40" /> {order.email}
            </p>
            <p className="flex items-center gap-1.5">
              <Phone size={12} className="text-ink/40" /> {order.phone ?? '—'}
            </p>
            {order.user ? (
              <Link
                href={`/admin/customers/${order.user.id}`}
                className="inline-block mt-1 text-accent hover:underline"
              >
                View customer profile
              </Link>
            ) : (
              <span className="inline-block mt-1 text-ink/40">Guest checkout</span>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border border-line rounded-sm p-5 bg-white">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
            <MapPin size={14} className="text-accent" />
            <span>Shipping Address</span>
          </div>
          {order.address ? (
            <div className="text-xs text-ink/70 space-y-1">
              <p className="font-semibold text-ink">{order.address.name}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
              <p className="text-ink/50 pt-1">Phone: {order.address.phone}</p>
            </div>
          ) : (
            <p className="text-xs text-ink/40">No saved address</p>
          )}
        </div>

        {/* Payment */}
        <div className="border border-line rounded-sm p-5 bg-white">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
            <CreditCard size={14} className="text-accent" />
            <span>Payment</span>
          </div>
          <div className="text-xs text-ink/70 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink/50">Method</span>
              <span>{order.payment?.method ? order.payment.method.toUpperCase() : 'Online / Razorpay'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/50">Status</span>
              <span className="font-medium">{order.payment?.status ?? '—'}</span>
            </div>
            {order.payment?.razorpayPaymentId && (
              <div className="flex justify-between gap-2">
                <span className="text-ink/50">Payment ID</span>
                <span className="font-mono truncate">{order.payment.razorpayPaymentId}</span>
              </div>
            )}
            {order.payment?.razorpayOrderId && (
              <div className="flex justify-between gap-2">
                <span className="text-ink/50">Order ID</span>
                <span className="font-mono truncate">{order.payment.razorpayOrderId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipment management + Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ShipmentForm orderId={order.id} shipment={order.shipment} />
        </div>

        <div className="border border-line rounded-sm p-5 bg-white">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
            <Tag size={14} className="text-accent" />
            <span>Order Totals</span>
          </div>
          <div className="space-y-2 text-xs text-ink/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-ink">{formatINR(order.subtotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount {order.coupon && `(${order.coupon.code})`}</span>
                <span>-{formatINR(order.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shippingTotal === 0 ? 'FREE' : formatINR(order.shippingTotal)}</span>
            </div>
            {order.taxTotal > 0 && (
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatINR(order.taxTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2.5 text-sm font-semibold text-ink">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}