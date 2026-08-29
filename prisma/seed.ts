import { PrismaClient, PosterSize, PosterMaterial, PosterFrame, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

const CATEGORIES = [
  { slug: 'anime', name: 'Anime' },
  { slug: 'movies', name: 'Movies' },
  { slug: 'music', name: 'Music' },
  { slug: 'sports', name: 'Sports' },
  { slug: 'cars', name: 'Cars' },
  { slug: 'gaming', name: 'Gaming' },
  { slug: 'minimal', name: 'Minimal' },
  { slug: 'typography', name: 'Typography' },
  { slug: 'abstract', name: 'Abstract' },
  { slug: 'nature', name: 'Nature' },
  { slug: 'travel', name: 'Travel' },
  { slug: 'art', name: 'Art' },
];

const TITLES: Record<string, string[]> = {
  anime: ['Ronin Sunset', 'Sakura Drift', 'Neo Tokyo Nights'],
  movies: ['Neon Noir', 'Midnight Reel', 'The Last Frame'],
  music: ['Vinyl Static', 'Bassline', 'Studio 4AM'],
  sports: ['Match Point', 'Full Court', 'The Sprint'],
  cars: ['Apex Curve', 'Redline', 'Midnight GT'],
  gaming: ['Pixel Realm', 'Boss Fight', 'Respawn'],
  minimal: ['Quiet Lines', 'Negative Space', 'One Form'],
  typography: ['Bold Statement', 'Serif Study', 'Letterform'],
  abstract: ['Fluid Motion', 'Color Field', 'Fractured'],
  nature: ['Forest Line', 'Golden Hour', 'Coastal Fog'],
  travel: ['Wander North', 'Faraway Coast', 'City Map'],
  art: ['Study No.4', 'Ink Wash', 'Brushwork'],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding database...');

  // --- Admin/staff users ---
  const ownerPassword = await bcrypt.hash('ChangeMe123!', 12);
  await prisma.user.upsert({
    where: { email: 'owner@posterraxx.com' },
    update: {},
    create: {
      email: 'owner@posterraxx.com',
      name: 'Store Owner',
      passwordHash: ownerPassword,
      role: Role.OWNER,
      emailVerified: new Date(),
    },
  });
  console.log('Created OWNER account: owner@posterraxx.com / ChangeMe123! (change this immediately)');

  // --- Categories ---
  const categoryRecords: Record<string, { id: string }> = {};
  for (const cat of CATEGORIES) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        name: cat.name,
        description: `Premium ${cat.name.toLowerCase()} posters — archival printing, made to order.`,
      },
    });
    categoryRecords[cat.slug] = record;
  }

  // --- Coupons ---
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minOrderAmount: 0, firstOrderOnly: true, perUserLimit: 1 },
  });
  await prisma.coupon.upsert({
    where: { code: 'POSTER20' },
    update: {},
    create: { code: 'POSTER20', type: 'PERCENTAGE', value: 20, minOrderAmount: 200000, perUserLimit: 2 },
  });

  // --- Products (30+) ---
  let count = 0;
  for (const cat of CATEGORIES) {
    const titles = TITLES[cat.slug] ?? ['Untitled Print'];
    for (const [idx, title] of titles.entries()) {
      count++;
      const basePricePaise = (24900 + (count % 5) * 6000); // ₹249-ish A5 matte no-frame base
      const hasDiscount = count % 3 === 0;
      const slug = slugify(`${title}-${cat.slug}`);

      const product = await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          title,
          slug,
          description: `A carefully composed ${cat.name.toLowerCase()} print — archival matte base, colour-calibrated for accuracy, printed to order in India.`,
          categoryId: categoryRecords[cat.slug].id,
          status: 'ACTIVE',
          featured: count % 6 === 0,
          bestSeller: count % 4 === 0,
          newArrival: count % 5 === 0,
          ratingAvg: Number((3.8 + ((count * 7) % 12) / 10).toFixed(1)),
          ratingCount: 8 + ((count * 13) % 140),
          images: {
            create: [
              { url: `https://picsum.photos/seed/${cat.slug}${count}/700/933`, position: 0, altText: title },
              { url: `https://picsum.photos/seed/${cat.slug}${count}b/700/933`, position: 1, altText: title },
            ],
          },
        },
      });

      for (const s of SIZES) {
        for (const m of MATERIALS) {
          for (const f of FRAMES) {
            const price = Math.round(basePricePaise * s.mult) + m.addon + f.addon;
            const compareAtPrice = hasDiscount ? Math.round(price * 1.25) : null;
            const sku = `${slug}-${s.size}-${m.material}-${f.frame}`.toUpperCase();

            const variant = await prisma.productVariant.upsert({
              where: { productId_size_material_frame: { productId: product.id, size: s.size, material: m.material, frame: f.frame } },
              update: {},
              create: {
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

            await prisma.inventory.upsert({
              where: { variantId: variant.id },
              update: {},
              create: { variantId: variant.id, stock: 40 + ((count * 3) % 60), reserved: 0 },
            });
          }
        }
      }
    }
  }

  console.log(`Seeded ${count} products across ${CATEGORIES.length} categories, each with ${SIZES.length * MATERIALS.length * FRAMES.length} variants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
