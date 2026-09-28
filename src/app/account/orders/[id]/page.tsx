import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
  AlertCircle,
} from 'lucide-react';
import { OrderStatus } from '@prisma/client';
import { InvoiceButton } from '@/components/orders/InvoiceButton';

const FULFILLMENT_STEPS: { key: string; label: string; icon: any }[] = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'PAID', label: 'Payment Confirmed', icon: CreditCard },
  { key: 'PRINTING', label: 'Printing & Giclée QA', icon: Package },
  { key: 'PACKED', label: 'Packed & Framed', icon: Package },
  { key: 'SHIPPED', label: 'In Transit', icon: Truck },
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

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: { take: 1, orderBy: { position: 'asc' } } },
              },
            },
          },
        },
      },
      address: true,
      payment: true,
      shipment: true,
      coupon: true,
    },
  });

  if (!order || order.userId !== userId) {
    notFound();
  }

  const currentStep = STATUS_PROGRESS[order.status] ?? 0;
  const isCancelled = currentStep === -1;

  return (
    <div className="max-w-3xl">
      {/* Back button & Header */}
      <div className="mb-6">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Back to all orders
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display">{order.orderNumber}</h1>
            <p className="text-xs text-ink/50 mt-1">
              Placed on {format(order.createdAt, 'dd MMMM yyyy, h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <InvoiceButton orderId={order.id} />
            <span className="text-xs uppercase tracking-wider font-semibold bg-line px-3 py-2 rounded-sm">
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Fulfillment Progress Timeline */}
      {!isCancelled ? (
        <div className="border border-line rounded-sm p-6 bg-surface mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/50 mb-6">
            Fulfillment Progress
          </h2>
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
                        ? 'bg-accent text-white ring-4 ring-accent/20 animate-pulse'
                        : 'bg-line/40 text-ink/30'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={16} /> : <StepIcon size={16} />}
                  </div>
                  <p
                    className={`text-[11px] leading-tight ${
                      isCurrent
                        ? 'font-semibold text-ink'
                        : isCompleted
                        ? 'text-ink/80'
                        : 'text-ink/40'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {order.shipment?.trackingNumber && (
            <div className="mt-6 pt-5 border-t border-line/60 flex items-center justify-between text-xs">
              <span className="text-ink/60">
                Courier: <strong>{order.shipment.provider || 'BlueDart / Delhivery'}</strong>
              </span>
              <span className="font-mono text-ink">
                Tracking: <strong>{order.shipment.trackingNumber}</strong>
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-red-200 bg-red-50 p-4 rounded-sm flex items-center gap-3 text-xs text-red-700 mb-8">
          <AlertCircle size={16} />
          <span>This order has been {order.status.toLowerCase().replace(/_/g, ' ')}.</span>
        </div>
      )}

      {/* Items Breakdown */}
      <div className="border border-line rounded-sm overflow-hidden bg-surface mb-8">
        <div className="px-6 py-4 border-b border-line bg-line/20">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/60">
            Items Ordered ({order.items.length})
          </h2>
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
                    className="w-14 h-18 object-cover rounded-sm border border-line shrink-0"
                  />
                ) : (
                  <div className="w-14 h-18 bg-line/40 rounded-sm flex items-center justify-center text-ink/20 text-xs shrink-0">
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

      {/* Order Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address */}
        <div className="border border-line rounded-sm p-5 bg-surface">
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
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              <p className="text-ink/50 pt-1">Phone: {order.address.phone}</p>
            </div>
          ) : (
            <p className="text-xs text-ink/40">Standard Shipping Address</p>
          )}
        </div>

        {/* Payment & Summary */}
        <div className="border border-line rounded-sm p-5 bg-surface">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">
            <CreditCard size={14} className="text-accent" />
            <span>Payment Breakdown</span>
          </div>

          <div className="space-y-2 text-xs text-ink/70">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-ink">{formatINR(order.subtotal)}</span>
            </div>

            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="flex items-center gap-1">
                  <Tag size={12} /> Discount {order.coupon && `(${order.coupon.code})`}
                </span>
                <span>-{formatINR(order.discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{order.shippingTotal === 0 ? 'FREE' : formatINR(order.shippingTotal)}</span>
            </div>

            <div className="flex justify-between border-t border-line pt-2.5 text-sm font-semibold text-ink">
              <span>Total Paid</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
