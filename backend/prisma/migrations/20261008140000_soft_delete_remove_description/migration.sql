ALTER TABLE "products" DROP COLUMN IF EXISTS "description";
ALTER TABLE "feedbacks"      ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "review_replies" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "categories"     ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "suppliers"      ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "banners"        ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "deleted_at" TIMESTAMP(3);
