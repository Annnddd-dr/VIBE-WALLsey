import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInvoiceHTML } from '@/lib/invoice';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  if (!session?.user) {
    return NextResponse.json({ error: 'Please sign in to view invoice.' }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      address: true,
      payment: true,
      coupon: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  // Auth gate: must be order owner or staff
  const isOwner = order.userId === userId;
  const isStaff = hasRole(userRole, 'STAFF');

  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const html = generateInvoiceHTML(order);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
