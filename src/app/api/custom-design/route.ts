import { createHash } from 'crypto';
import { PosterSize } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { prisma } from '@/lib/prisma';
import { SIZE_BASE_PRICE } from '@/types';

const RequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{8,20}$/),
  size: z.nativeEnum(PosterSize),
  quantity: z.coerce.number().int().min(1).max(25),
  notes: z.string().trim().max(2000).optional(),
});

const MAX_ARTWORK_BYTES = 8 * 1024 * 1024;
const ALLOWED_ARTWORK_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function isRateLimited(ip: string) {
  const key = `custom-design:${createHash('sha256').update(ip).digest('hex')}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + 60 * 60 * 1000);

  const count = await prisma.$transaction(async (tx) => {
    await tx.rateLimitEntry.updateMany({
      where: { key, resetAt: { lte: now } },
      data: { count: 0, resetAt },
    });

    const entry = await tx.rateLimitEntry.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: { increment: 1 } },
    });

    return entry.count;
  });

  return count > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  try {
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const formData = await req.formData();
    const parsed = RequestSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      size: formData.get('size'),
      quantity: formData.get('quantity'),
      notes: formData.get('notes') || undefined,
    });
    const artwork = formData.get('artwork');

    if (!parsed.success || !(artwork instanceof File)) {
      return NextResponse.json({ error: 'Check your details and attach an artwork image.' }, { status: 400 });
    }
    if (!ALLOWED_ARTWORK_TYPES.has(artwork.type) || artwork.size === 0 || artwork.size > MAX_ARTWORK_BYTES) {
      return NextResponse.json({ error: 'Use a JPG, PNG, or WebP image up to 8 MB.' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    let upload: { url: string; publicId: string };
    try {
      upload = await uploadImage(Buffer.from(await artwork.arrayBuffer()), 'vibewallsey/custom-design-requests');
    } catch (error) {
      console.error('[custom-design] Artwork upload failed:', error);
      return NextResponse.json({ error: 'Artwork upload is temporarily unavailable.' }, { status: 503 });
    }

    const estimatedCost = SIZE_BASE_PRICE[parsed.data.size] * parsed.data.quantity;
    try {
      const request = await prisma.customDesignRequest.create({
        data: {
          ...parsed.data,
          email: parsed.data.email.toLowerCase(),
          userId: (session?.user as { id?: string } | undefined)?.id,
          artworkUrl: upload.url,
          estimatedCost,
        },
        select: { id: true, estimatedCost: true },
      });

      return NextResponse.json(request, { status: 201 });
    } catch (error) {
      await deleteImage(upload.publicId);
      throw error;
    }
  } catch (error) {
    console.error('[custom-design] Request failed:', error);
    return NextResponse.json({ error: 'We could not submit your request. Please try again.' }, { status: 500 });
  }
}