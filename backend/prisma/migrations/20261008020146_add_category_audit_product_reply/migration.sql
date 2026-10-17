-- Create categories and preserve the existing products.category values.
-- This migration owns the category conversion and the related schema additions.

-- Create categories before moving product data.
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

CREATE UNIQUE INDEX "categories_category_name_key"
    ON "categories"("category_name");

-- Copy existing category names before dropping the old products.category column.
INSERT INTO "categories" ("category_name")
SELECT DISTINCT TRIM("category")
FROM "products"
WHERE "category" IS NOT NULL
  AND TRIM("category") <> ''
ON CONFLICT ("category_name") DO NOTHING;

ALTER TABLE "products" ADD COLUMN "category_id" INTEGER;

UPDATE "products" AS p
SET "category_id" = c."category_id"
FROM "categories" AS c
WHERE TRIM(p."category") = c."category_name";

DROP INDEX IF EXISTS "products_category_idx";
ALTER TABLE "products" DROP COLUMN "category";
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

ALTER TABLE "products"
    ADD CONSTRAINT "products_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "categories"("category_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Review replies.
CREATE TABLE "review_replies" (
    "reply_id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("reply_id")
);
CREATE INDEX "review_replies_feedback_id_idx" ON "review_replies"("feedback_id");
CREATE INDEX "review_replies_account_id_idx" ON "review_replies"("account_id");
ALTER TABLE "review_replies"
    ADD CONSTRAINT "review_replies_feedback_id_fkey"
    FOREIGN KEY ("feedback_id") REFERENCES "feedbacks"("feedback_id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_replies"
    ADD CONSTRAINT "review_replies_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Audit log.
CREATE TABLE "audit_logs" (
    "log_id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "actor_name" VARCHAR(50) NOT NULL,
    "actor_role" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(30) NOT NULL,
    "entity_id" INTEGER,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "accounts"("account_id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Survey creator.
ALTER TABLE "surveys" ADD COLUMN "created_by" INTEGER;
CREATE INDEX "surveys_created_by_idx" ON "surveys"("created_by");
ALTER TABLE "surveys"
    ADD CONSTRAINT "surveys_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "accounts"("account_id")
    ON DELETE SET NULL ON UPDATE CASCADE;
