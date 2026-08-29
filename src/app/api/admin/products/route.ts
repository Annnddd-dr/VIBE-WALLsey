import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PosterSize, PosterMaterial, PosterFrame } from '@prisma/client';

// --- Variant generation constants (mirroring seed.ts) ---
const SIZES: { size: PosterSize; mult: number }[] = [
  { size: 'A5', mult: 1 },
  { size: 'A4', mult: 1.5 },
  { size: 'A3', mult: 2.2 },
  { size: 'A2', mult: 3.2 },
  { size: 'A1', mult: 4.5 },
];
const MATERIALS: { material: PosterMaterial; addon: number }[] = [
  { material: 'MATTE', addon: 0 },
  { material: 'GLOSSY', addon: 5000 },
  { material: 'TEXTURED', addon: 8000 },
];
const FRAMES: { frame: PosterFrame; addon: number }[] = [
  { frame: 'NONE', addon: 0 },
  { frame: 'BLACK', addon: 30000 },
  { frame: 'WHITE', addon: 30000 },
  { frame: 'WOOD', addon: 45000 },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// --- Zod schemas ---
const ImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  publicId: z.string().optional(),
});

const CreateProductSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1),
  artist: z.string().optional(),
  categoryId: z.string().min(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  limited: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  images: z.array(ImageSchema).default([]),
  basePricePaise: z.number().int().min(100),
  compareAtPricePaise: z.number().int().min(0).optional(),
  defaultStock: z.number().int().min(0).default(50),
});

export async function POST(req: NextRequest) {
  // --- Auth gate ---
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !hasRole(role, 'MANAGER')) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  let slug = data.slug || slugify(data.title);

  // Ensure slug uniqueness
  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      // 1. Create product
      const product = await tx.product.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          artist: data.artist ?? null,
          categoryId: data.categoryId,
          status: data.status,
          featured: data.featured,
          bestSeller: data.bestSeller,
          newArrival: data.newArrival,
          limited: data.limited,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          images: {
            create: data.images.map((img, i) => ({
              url: img.url,
              altText: img.altText ?? data.title,
              position: i,
            })),
          },
        },
      });

      // 2. Generate variants (size × material × frame)
      for (const s of SIZES) {
        for (const m of MATERIALS) {
          for (const f of FRAMES) {
            const price = Math.round(data.basePricePaise * s.mult) + m.addon + f.addon;
            const compareAtPrice = data.compareAtPricePaise
              ? Math.round(data.compareAtPricePaise * s.mult) + m.addon + f.addon
              : null;
            const sku = `${slug}-${s.size}-${m.material}-${f.frame}`.toUpperCase();

            const variant = await tx.productVariant.create({
              data: {
                productId: product.id,
                size: s.size,
                material: m.material,
                frame: f.frame,
                sku,
                price,
                compareAtPrice,
                weightGrams: 150 + Math.round(s.mult * 80),
              },
            });

            await tx.inventory.create({
              data: { variantId: variant.id, stock: data.defaultStock, reserved: 0 },
            });
          }
        }
      }

      return product;
    });

    // Return product with relations
    const full = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: { include: { inventory: true } },
        category: true,
      },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (err: any) {
    console.error('[admin/products] Create error:', err);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}
