import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const PRODUCT_INCLUDE = {
  images: { orderBy: { position: 'asc' as const } },
  variants: { include: { inventory: true }, orderBy: { sku: 'asc' as const } },
  category: true,
};

// --- GET: fetch a single product for editing ---
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'STAFF')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: PRODUCT_INCLUDE,
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  return NextResponse.json(product);
}

// --- PUT: update product metadata, images, variant pricing & inventory ---
const ImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  altText: z.string().optional(),
  publicId: z.string().optional(),
});

const VariantUpdateSchema = z.object({
  id: z.string(),
  price: z.number().int().min(0).optional(),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  stock: z.number().int().min(0).optional(),
});

const UpdateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  artist: z.string().nullable().optional(),
  categoryId: z.string().min(1).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  bestSeller: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  limited: z.boolean().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  images: z.array(ImageSchema).optional(),
  variants: z.array(VariantUpdateSchema).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'MANAGER')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = UpdateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check product exists
  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  // Check slug uniqueness if changing
  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (slugTaken) {
      return NextResponse.json({ error: 'Slug already in use.' }, { status: 409 });
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update product metadata
      const { images: _images, variants: _variants, ...productData } = data;
      const updateData: any = {};
      for (const [key, value] of Object.entries(productData)) {
        if (value !== undefined) updateData[key] = value;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.product.update({ where: { id: params.id }, data: updateData });
      }

      // 2. Sync images (delete old, create new in order)
      if (data.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: params.id } });
        for (let i = 0; i < data.images.length; i++) {
          const img = data.images[i];
          await tx.productImage.create({
            data: {
              productId: params.id,
              url: img.url,
              altText: img.altText ?? existing.title,
              position: i,
            },
          });
        }
      }

      // 3. Update variants (price, compareAtPrice, isActive, stock)
      if (data.variants) {
        for (const v of data.variants) {
          const variantUpdate: any = {};
          if (v.price !== undefined) variantUpdate.price = v.price;
          if (v.compareAtPrice !== undefined) variantUpdate.compareAtPrice = v.compareAtPrice;
          if (v.isActive !== undefined) variantUpdate.isActive = v.isActive;

          if (Object.keys(variantUpdate).length > 0) {
            await tx.productVariant.update({ where: { id: v.id }, data: variantUpdate });
          }

          if (v.stock !== undefined) {
            await tx.inventory.upsert({
              where: { variantId: v.id },
              update: { stock: v.stock },
              create: { variantId: v.id, stock: v.stock, reserved: 0 },
            });
          }
        }
      }
    });

    // Return updated product
    const updated = await prisma.product.findUnique({
      where: { id: params.id },
      include: PRODUCT_INCLUDE,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[admin/products] Update error:', err);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

// --- DELETE: archive or hard-delete a product ---
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'ADMIN')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  const url = new URL(req.url);
  const hard = url.searchParams.get('hard') === 'true';

  if (hard) {
    // Hard delete — cascades to variants, images, inventory via Prisma schema
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true, deleted: true });
  } else {
    // Soft delete — archive the product
    await prisma.product.update({ where: { id: params.id }, data: { status: 'ARCHIVED' } });
    return NextResponse.json({ ok: true, archived: true });
  }
}
