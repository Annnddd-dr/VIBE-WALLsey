-- New official price sheet: Polaroid ₹10 · A6 ₹15 · A5 ₹30 · A4 ₹40 · A3 ₹60.
-- A2 / A1 leave the catalog entirely.

-- 1. Remove A2/A1 variants (inventory rows first; the seed formula keeps
--    unique constraint productId_size_material_frame intact afterwards).
DELETE FROM "Inventory" WHERE "variantId" IN (
  SELECT "id" FROM "ProductVariant" WHERE "size" IN ('A2', 'A1')
);
DELETE FROM "ProductVariant" WHERE "size" IN ('A2', 'A1');

-- 2. Reprice: base A4 6000→4000 (−₹20) and A3 12000→6000 (−₹60) for every
--    material/frame combination; compareAtPrice tracked at +25%.
UPDATE "ProductVariant" SET
  "price" = "price" - 2000,
  "compareAtPrice" = "compareAtPrice" - 2000
WHERE "size" = 'A4';
UPDATE "ProductVariant" SET
  "price" = "price" - 6000,
  "compareAtPrice" = "compareAtPrice" - 6000
WHERE "size" = 'A3';

-- 3. Shrink the enum.
ALTER TYPE "PosterSize" RENAME TO "PosterSize_old";
CREATE TYPE "PosterSize" AS ENUM ('A6', 'A5', 'A4', 'A3', 'POLAROID');
ALTER TABLE "ProductVariant" ALTER COLUMN "size" DROP DEFAULT;
ALTER TABLE "ProductVariant" ALTER COLUMN "size" TYPE "PosterSize"
  USING ("size"::text::"PosterSize");
ALTER TABLE "ProductVariant" ALTER COLUMN "size" SET DEFAULT 'A5';
DROP TYPE "PosterSize_old";
