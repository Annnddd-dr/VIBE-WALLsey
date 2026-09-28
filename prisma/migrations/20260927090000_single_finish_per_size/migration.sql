-- Materials & frames leave the catalog. Every product keeps ONE variant per
-- size: the premium Matte / No-Frame finish at the official price sheet price.
-- Client asked: no material picker, no frame picker anywhere in the store.

-- 1. Inventory rows of the combos we are deleting go first (FK).
DELETE FROM "Inventory" WHERE "variantId" IN (
  SELECT "id" FROM "ProductVariant"
  WHERE NOT ("material" = 'MATTE' AND "frame" = 'NONE')
);

-- 2. Delete every non-(Matte, No-Frame) variant.
DELETE FROM "ProductVariant"
WHERE NOT ("material" = 'MATTE' AND "frame" = 'NONE');

-- 3. Shrink the enums to their single remaining value.
ALTER TYPE "PosterMaterial" RENAME TO "PosterMaterial_old";
CREATE TYPE "PosterMaterial" AS ENUM ('MATTE');
ALTER TABLE "ProductVariant" ALTER COLUMN "material" DROP DEFAULT;
ALTER TABLE "ProductVariant" ALTER COLUMN "material" TYPE "PosterMaterial"
  USING ("material"::text::"PosterMaterial");
ALTER TABLE "ProductVariant" ALTER COLUMN "material" SET DEFAULT 'MATTE';
DROP TYPE "PosterMaterial_old";

ALTER TYPE "PosterFrame" RENAME TO "PosterFrame_old";
CREATE TYPE "PosterFrame" AS ENUM ('NONE');
ALTER TABLE "ProductVariant" ALTER COLUMN "frame" DROP DEFAULT;
ALTER TABLE "ProductVariant" ALTER COLUMN "frame" TYPE "PosterFrame"
  USING ("frame"::text::"PosterFrame");
ALTER TABLE "ProductVariant" ALTER COLUMN "frame" SET DEFAULT 'NONE';
DROP TYPE "PosterFrame_old";

-- 4. Enforce one variant per (product, size) going forward. The old unique
--    constraint included material+frame; replace it with the simpler one.
DROP INDEX IF EXISTS "ProductVariant_productId_size_material_frame_key";
CREATE UNIQUE INDEX "ProductVariant_productId_size_key"
  ON "ProductVariant" ("productId", "size");
