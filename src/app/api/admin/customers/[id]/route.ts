import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Role } from '@prisma/client';

const RoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'OWNER']),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const currentUserId = (session?.user as any)?.id;

  if (!session?.user || !hasRole(userRole, 'ADMIN')) {
    return NextResponse.json({ error: 'Only ADMIN or OWNER can change roles.' }, { status: 403 });
  }

  // Prevent users from changing their own role
  if (currentUserId === params.id) {
    return NextResponse.json({ error: 'Cannot change your own role.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { role: parsed.data.role as Role },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[admin/customers] Role update error:', err);
    return NextResponse.json({ error: 'Failed to update customer.' }, { status: 500 });
  }
}
