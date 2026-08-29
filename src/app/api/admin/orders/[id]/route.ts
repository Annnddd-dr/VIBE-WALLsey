import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendOrderStatusEmail } from '@/lib/email';

const STATUSES = [
  'PENDING', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'PRINTING', 'PACKED',
  'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REQUESTED', 'RETURNED',
] as const;

const Schema = z.object({ status: z.enum(STATUSES) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });

  const order = await prisma.order.update({ where: { id: params.id }, data: { status: parsed.data.status } });

  sendOrderStatusEmail(order.email, order.orderNumber, order.status.replace(/_/g, ' ')).catch(() => {});

  return NextResponse.json({ ok: true, order });
}
