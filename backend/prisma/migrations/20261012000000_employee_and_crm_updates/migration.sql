-- Migration gộp, chạy an toàn dù DB đang ở trạng thái nào (IF EXISTS / IF NOT EXISTS).

-- ===== 1. Employee =====
CREATE TABLE IF NOT EXISTS "employees" (
  "employee_id" INTEGER NOT NULL,
  "employee_code" VARCHAR(20) NOT NULL,
  "full_name" VARCHAR(100) NOT NULL,
  "date_of_birth" DATE,
  "gender" VARCHAR(10),
  "phone" VARCHAR(20),
  "address" VARCHAR(255),
  "position" VARCHAR(100),
  "hire_date" DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "employees_employee_code_key" ON "employees"("employee_code");
ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_employee_id_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mỗi tài khoản Admin/Manager hiện có -> 1 nhân viên (họ tên mặc định = username)
INSERT INTO "employees" ("employee_id","employee_code","full_name","position")
SELECT a."account_id", 'NV' || LPAD(a."account_id"::text, 3, '0'), a."username",
       CASE r."role_name" WHEN 'Admin' THEN 'Quản trị viên' ELSE 'Quản lý CRM' END
FROM "accounts" a JOIN "roles" r ON r."role_id" = a."role_id"
WHERE r."role_name" IN ('Admin','Manager')
ON CONFLICT ("employee_id") DO NOTHING;

-- ===== 2. Category + Product.category_id =====
CREATE TABLE IF NOT EXISTS "categories" (
  "category_id" SERIAL NOT NULL,
  "category_name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(255),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "categories_category_name_key" ON "categories"("category_name");
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" INTEGER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN
    INSERT INTO "categories" ("category_name")
    SELECT DISTINCT TRIM("category") FROM "products" WHERE "category" IS NOT NULL AND TRIM("category") <> ''
    ON CONFLICT DO NOTHING;
    UPDATE "products" p SET "category_id" = c."category_id"
    FROM "categories" c WHERE TRIM(p."category") = c."category_name" AND p."category_id" IS NULL;
    DROP INDEX IF EXISTS "products_category_idx";
    ALTER TABLE "products" DROP COLUMN "category";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products"("category_id");
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_category_id_fkey";
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bỏ mô tả sản phẩm, nới cột size (seed dùng dạng 37/38/39...)
ALTER TABLE "products" DROP COLUMN IF EXISTS "description";
ALTER TABLE "products" ALTER COLUMN "size" TYPE VARCHAR(50);

-- ===== 3. Xóa mềm =====
ALTER TABLE "feedbacks"  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "suppliers"  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
ALTER TABLE "banners"    ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- ===== 4. ReviewReply -> employee_id =====
CREATE TABLE IF NOT EXISTS "review_replies" (
  "reply_id" SERIAL NOT NULL,
  "feedback_id" INTEGER NOT NULL,
  "employee_id" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "review_replies_pkey" PRIMARY KEY ("reply_id")
);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_replies' AND column_name='account_id') THEN
    ALTER TABLE "review_replies" RENAME COLUMN "account_id" TO "employee_id";
  END IF;
END $$;
ALTER TABLE "review_replies" ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
DROP INDEX IF EXISTS "review_replies_account_id_idx";
CREATE INDEX IF NOT EXISTS "review_replies_feedback_id_idx" ON "review_replies"("feedback_id");
CREATE INDEX IF NOT EXISTS "review_replies_employee_id_idx" ON "review_replies"("employee_id");
ALTER TABLE "review_replies" DROP CONSTRAINT IF EXISTS "review_replies_account_id_fkey";
ALTER TABLE "review_replies" DROP CONSTRAINT IF EXISTS "review_replies_employee_id_fkey";
ALTER TABLE "review_replies" DROP CONSTRAINT IF EXISTS "review_replies_feedback_id_fkey";
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_feedback_id_fkey"
  FOREIGN KEY ("feedback_id") REFERENCES "feedbacks"("feedback_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ===== 5. AuditLog -> employee_id =====
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "log_id" SERIAL NOT NULL,
  "employee_id" INTEGER,
  "actor_name" VARCHAR(50) NOT NULL,
  "actor_role" VARCHAR(50) NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "entity_type" VARCHAR(30) NOT NULL,
  "entity_id" INTEGER,
  "description" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("log_id")
);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='actor_id') THEN
    ALTER TABLE "audit_logs" RENAME COLUMN "actor_id" TO "employee_id";
  END IF;
END $$;
DROP INDEX IF EXISTS "audit_logs_actor_id_idx";
CREATE INDEX IF NOT EXISTS "audit_logs_employee_id_idx" ON "audit_logs"("employee_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_id_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_employee_id_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== 6. Survey.created_by -> employees =====
ALTER TABLE "surveys" ADD COLUMN IF NOT EXISTS "created_by" INTEGER;
CREATE INDEX IF NOT EXISTS "surveys_created_by_idx" ON "surveys"("created_by");
ALTER TABLE "surveys" DROP CONSTRAINT IF EXISTS "surveys_created_by_fkey";
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;
UPDATE "surveys" SET "created_by" = (SELECT e."employee_id" FROM "employees" e
  JOIN "accounts" a ON a."account_id" = e."employee_id" JOIN "roles" r ON r."role_id" = a."role_id"
  WHERE r."role_name" = 'Manager' ORDER BY e."employee_id" LIMIT 1) WHERE "created_by" IS NULL;

-- ===== 7. Feedback.handled_by / Customer.created_by =====
ALTER TABLE "feedbacks" ADD COLUMN IF NOT EXISTS "handled_by" INTEGER, ADD COLUMN IF NOT EXISTS "handled_at" TIMESTAMP(3);
ALTER TABLE "feedbacks" DROP CONSTRAINT IF EXISTS "feedbacks_handled_by_fkey";
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_handled_by_fkey"
  FOREIGN KEY ("handled_by") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "created_by" INTEGER;
CREATE INDEX IF NOT EXISTS "customers_created_by_idx" ON "customers"("created_by");
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_created_by_fkey";
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "employees"("employee_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ===== 8. Sửa created_at nằm ở tương lai =====
UPDATE "feedbacks" SET "created_at" = LEAST("created_at", (NOW() AT TIME ZONE 'UTC'));
UPDATE "surveys"   SET "created_at" = LEAST("created_at", (NOW() AT TIME ZONE 'UTC'));

-- ===== 9. Dọn cột hồ sơ tạm trên accounts (nếu từng chạy bước thêm hồ sơ vào Account) =====
ALTER TABLE "accounts" DROP COLUMN IF EXISTS "full_name", DROP COLUMN IF EXISTS "phone",
  DROP COLUMN IF EXISTS "date_of_birth", DROP COLUMN IF EXISTS "address";
