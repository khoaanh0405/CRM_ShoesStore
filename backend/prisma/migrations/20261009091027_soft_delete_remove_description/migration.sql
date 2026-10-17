/*
  Migration: soft delete and product schema adjustments
*/

-- Products
ALTER TABLE "products"
  DROP COLUMN IF EXISTS "description";

ALTER TABLE "products"
  ALTER COLUMN "size" SET DATA TYPE VARCHAR(50);

-- Feedbacks
ALTER TABLE "feedbacks"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Review replies
ALTER TABLE "review_replies"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Categories
ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Suppliers
ALTER TABLE "suppliers"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Banners
ALTER TABLE "banners"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);