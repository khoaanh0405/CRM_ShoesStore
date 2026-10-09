/*
  Warnings:

  - You are about to drop the column `description` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "description",
ALTER COLUMN "size" SET DATA TYPE VARCHAR(50);

ALTER TABLE "feedbacks"      ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "review_replies" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "categories"     ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "suppliers"      ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "banners"        ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);