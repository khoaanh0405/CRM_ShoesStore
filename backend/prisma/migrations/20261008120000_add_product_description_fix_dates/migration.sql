ALTER TABLE "products" ADD COLUMN "description" TEXT;
UPDATE "feedbacks" SET "created_at" = LEAST("created_at", (NOW() AT TIME ZONE 'UTC'));
UPDATE "surveys"   SET "created_at" = LEAST("created_at", (NOW() AT TIME ZONE 'UTC'));
