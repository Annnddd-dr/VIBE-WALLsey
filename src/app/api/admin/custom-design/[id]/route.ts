import { CustomDesignStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const UpdateSchema = z.object({ status: z.nativeEnum(CustomDesignStatus) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }
  const actor = session.user as { id?: string; email?: string | null };

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Choose a valid request status.' }, { status: 400 });
  }

  const existing = await prisma.customDesignRequest.findUnique({
    where: { id: params.id },
    select: { status: true },
  });
  if (!existing) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  if (existing.status === parsed.data.status) return NextResponse.json({ ok: true, status: existing.status });

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const request = await tx.customDesignRequest.update({
        where: { id: params.id },
        data: { status: parsed.data.status },
        select: { id: true, status: true },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email ?? 'unknown',
          action: 'CUSTOM_DESIGN_STATUS_UPDATED',
          targetType: 'CustomDesignRequest',
          targetId: request.id,
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
          metadata: { from: existing.status, to: request.status },
        },
      });
      return request;
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (error) {
    console.error('[admin/custom-design] Status update failed:', error);
    return NextResponse.json({ error: 'Could not update this request.' }, { status: 500 });
  }
}