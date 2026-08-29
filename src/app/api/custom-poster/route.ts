import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addToCart } from '@/lib/cart';
import { PosterSize, PosterMaterial, PosterFrame } from '@prisma/client';
import { z } from 'zod';

const SIZES: Record<PosterSize, number> = {
  A5: 1,
  A4: 1.5,
  A3: 2.2,
  A2: 3.2,
  A1: 4.5,
};

const MATERIALS: Record<PosterMaterial, number> = {
  MATTE: 0,
  GLOSSY: 5000,
  TEXTURED: 8000,
};

const FRAMES: Record<PosterFrame, number> = {
  NONE: 0,
  BLACK: 30000,
  WHITE: 30000,
  WOOD: 45000,
};

const BASE_PRICE = 29900; // ₹299 base for custom print

const Schema = z.object({
  imageUrl: z.string().url(),
  title: z.string().default('Custom Art Print'),
  size: z.enum(['A5', 'A4', 'A3', 'A2', 'A1']),
  material: z.enum(['MATTE', 'GLOSSY', 'TEXTURED']),
  frame: z.enum(['NONE', 'BLACK', 'WHITE', 'WOOD']),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id ?? null;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid configuration.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { imageUrl, title, size, material, frame, quantity } = parsed.data;

  try {
    // 1. Ensure "Custom Prints" category exists
    let category = await prisma.category.findUnique({ where: { slug: 'custom' } });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Custom Prints',
          slug: 'custom',
          description: 'Personalized bespoke art prints made with your own photos and designs.',
        },
      });
    }

    // 2. Create custom product record
    const slug = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const product = await prisma.product.create({
      data: {
        title: title || 'Custom Art Print',
        slug,
        description: 'Bespoke custom poster printed on museum-quality archival paper.',
        categoryId: category.id,
        status: 'ACTIVE',
        images: {
          create: [{ url: imageUrl, position: 0, altText: 'Custom Artwork' }],
        },
      },
    });

    // 3. Compute price for chosen variant
    const price = Math.round(BASE_PRICE * SIZES[size as PosterSize]) + MATERIALS[material as PosterMaterial] + FRAMES[frame as PosterFrame];
    const sku = `${slug}-${size}-${material}-${frame}`.toUpperCase();

    // 4. Create variant + inventory
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        size: size as PosterSize,
        material: material as PosterMaterial,
        frame: frame as PosterFrame,
        sku,
        price,
        weightGrams: 200,
        inventory: {
          create: { stock: 9999, reserved: 0 },
        },
      },
    });

    // 5. Add to user/guest cart
    await addToCart(userId, variant.id, quantity);

    return NextResponse.json({ ok: true, variantId: variant.id, product });
  } catch (err: any) {
    console.error('[custom-poster] Error:', err);
    return NextResponse.json({ error: 'Failed to create custom poster.' }, { status: 500 });
  }
}
