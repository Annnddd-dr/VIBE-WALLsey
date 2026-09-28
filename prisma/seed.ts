import { PrismaClient, PosterSize, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Official price sheet (paise) — one finish per size (Matte / No-Frame):
 *   Polaroid ₹10 · A6 ₹15 · A5 ₹30 · A4 ₹40 · A3 ₹60.
 */
const SIZE_BASE: Record<PosterSize, number> = {
  POLAROID: 1000,
  A6: 1500,
  A5: 3000,
  A4: 4000,
  A3: 6000,
};

// Seeded sizes for catalog products.
const SIZES: PosterSize[] = ['POLAROID', 'A6', 'A5', 'A4', 'A3'];

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

// 100 titles total: the original 3 per category (kept so existing slugs are
// re-priced) plus new ones — anime/movies/music/travel get 9, the rest 8.
const TITLES: Record<string, string[]> = {
  anime: ['Ronin Sunset', 'Sakura Drift', 'Neo Tokyo Nights', 'Spirit Rain', 'Mecha Garden', 'Ramen Alley', 'Kitsune Mask', 'Cloud Dojo', 'Ink Samurai'],
  movies: ['Neon Noir', 'Midnight Reel', 'The Last Frame', 'Marquee Lights', 'Cinema Verite', 'Director Cut', 'Reel Dreams', 'Velvet Screen', 'Silver Screen'],
  music: ['Vinyl Static', 'Bassline', 'Studio 4AM', 'Cassette Summer', 'Amped Up', 'Golden Disc', 'Fretboard', 'Encore', 'Sound Wave'],
  sports: ['Match Point', 'Full Court', 'The Sprint', 'Goal Line', 'Champion Lap', 'Prime Nine', 'Stadium Lights', 'Final Over'],
  cars: ['Apex Curve', 'Redline', 'Midnight GT', 'Pit Stop', 'Chrome Dreams', 'Rally Dust', 'Garage King', 'Widebody'],
  gaming: ['Pixel Realm', 'Boss Fight', 'Respawn', 'Level Up', 'Critical Hit', 'Loot Drop', 'Speedrun', 'Final Boss'],
  minimal: ['Quiet Lines', 'Negative Space', 'One Form', 'Soft Grid', 'Less Is More', 'Pure Form', 'Whitespace', 'Single Stroke'],
  typography: ['Bold Statement', 'Serif Study', 'Letterform', 'Kerned', 'Type Specimen', 'Grotesk', 'Italic Slant', 'Ampersand'],
  abstract: ['Fluid Motion', 'Color Field', 'Fractured', 'Soft Static', 'Folded Light', 'Geo Bloom', 'Ink Bloom', 'Chromatic'],
  nature: ['Forest Line', 'Golden Hour', 'Coastal Fog', 'Fern Valley', 'Mountain Air', 'Lake Still', 'Wild Meadow', 'River Bend'],
  travel: ['Wander North', 'Faraway Coast', 'City Map', 'Old Town', 'Night Train', 'Harbor Lights', 'Desert Road', 'Hill Station', 'Monsoon City'],
  art: ['Study No.4', 'Ink Wash', 'Brushwork', 'Charcoal Study', 'Pastel Haze', 'Life Drawing', 'Gouache Sky', 'Sketchbook'],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('Seeding database...');

  // --- Admin/staff users ---
  const ownerPassword = await bcrypt.hash('ChangeMe123!', 12);
  await prisma.user.upsert({
    where: { email: 'owner@vibewallsey.com' },
    update: {},
    create: {
      email: 'owner@vibewallsey.com',
      name: 'Store Owner',
      passwordHash: ownerPassword,
      role: Role.OWNER,
      emailVerified: new Date(),
    },
  });
  console.log('Created OWNER account: owner@vibewallsey.com / ChangeMe123! (change this immediately)');

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

  // --- Products (100) ---
  let count = 0;
  for (const cat of CATEGORIES) {
    const titles = TITLES[cat.slug] ?? ['Untitled Print'];
    for (const [idx, title] of titles.entries()) {
      count++;
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

      // Variants — one per size at the official sheet price. update: also
      // refreshes the price of pre-existing variants so a re-seed re-prices.
      for (const size of SIZES) {
        const price = SIZE_BASE[size];
        const compareAtPrice = hasDiscount ? Math.round(price * 1.25) : null;
        const sku = `${slug}-${size}`.toUpperCase();

        const variant = await prisma.productVariant.upsert({
          where: { productId_size: { productId: product.id, size } },
          update: { price, compareAtPrice },
          create: {
            productId: product.id,
            size,
            sku,
            price,
            compareAtPrice,
            weightGrams: size === 'POLAROID' ? 40 : 80 + Math.round((SIZE_BASE[size] / 6000) * 60),
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

  // --- Reviews (idempotent; only fills products that have none yet) ---
  const REVIEW_AUTHORS = [
    { name: 'Aarav S.', email: 'aarav.reviews@vibewallsey.com' },
    { name: 'Meera K.', email: 'meera.reviews@vibewallsey.com' },
    { name: 'Dev P.', email: 'dev.reviews@vibewallsey.com' },
    { name: 'Sana R.', email: 'sana.reviews@vibewallsey.com' },
    { name: 'Kabir M.', email: 'kabir.reviews@vibewallsey.com' },
    { name: 'Isha T.', email: 'isha.reviews@vibewallsey.com' },
  ];
  const REVIEW_TEXTS: { rating: number; title: string; body: string }[] = [
    { rating: 5, title: 'Better than the photos', body: 'The paper quality is unreal for this price — thick, matte, zero glare. Framed it the day it arrived and it completely changed the room.' },
    { rating: 5, title: 'Packing was flawless', body: 'Shipped in a rigid flat mailer with corner protectors. Zero bends, zero creases. Print colours look exactly like the listing.' },
    { rating: 4, title: 'Great print, wish it came framed', body: 'Quality is top-notch and shipping was quick. Took off one star only because I had to source a frame myself — the print itself is perfect.' },
    { rating: 5, title: 'Gifted it, absolute hit', body: 'Bought this for my brother and he loved it. Colours are deep, not washed out like cheaper prints I have ordered elsewhere.' },
    { rating: 4, title: 'Solid quality', body: 'Arrived in 4 days to Pune. The texture paper option is definitely worth the small extra cost.' },
    { rating: 5, title: 'Third order from these folks', body: 'Keep coming back — consistent quality every time. This one went above my study desk and the whole vibe of the room is different now.' },
  ];

  const authorIds: Record<string, string> = {};
  for (const a of REVIEW_AUTHORS) {
    const u = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        name: a.name,
        role: Role.CUSTOMER,
        emailVerified: new Date(),
      },
    });
    authorIds[a.email] = u.id;
  }

  const allProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: 24,
  });
  let reviewsAdded = 0;
  for (const [i, p] of allProducts.entries()) {
    const existing = await prisma.review.count({ where: { productId: p.id } });
    if (existing > 0) continue;
    const r = REVIEW_TEXTS[i % REVIEW_TEXTS.length];
    const author = REVIEW_AUTHORS[i % REVIEW_AUTHORS.length];
    await prisma.review.create({
      data: {
        productId: p.id,
        userId: authorIds[author.email],
        rating: r.rating,
        title: r.title,
        body: r.body,
        verifiedPurchase: true,
        status: 'APPROVED',
        featured: i < 3,
      },
    });
    reviewsAdded++;
  }

  console.log(`Seeded ${count} products across ${CATEGORIES.length} categories.`);
  console.log(`Price sheet: Polaroid ₹10 · A6 ₹15 · A5 ₹30 · A4 ₹40 · A3 ₹60 (Matte/No-frame).`);
  console.log(`Seeded ${reviewsAdded} customer reviews.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
