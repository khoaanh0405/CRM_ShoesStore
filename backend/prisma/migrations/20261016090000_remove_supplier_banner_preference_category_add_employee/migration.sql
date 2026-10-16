
-- Thay đổi CSDL:
-- 1) Bỏ suppliers, products.supplier_id và banners.
-- 2) Chuyển customer_preferences từ preference_tag sang category_id.
-- 3) Tạo hoặc cập nhật employees cho tài khoản Admin/Manager.
--
-- Thiết kế theo hướng an toàn khi một số bảng, cột, index
-- hoặc foreign key đã tồn tại từ migration trước.

-- =========================================================
-- 1. Bỏ nhà cung cấp và banner
-- =========================================================

ALTER TABLE "products"
  DROP CONSTRAINT IF EXISTS "products_supplier_id_fkey";

DROP INDEX IF EXISTS "products_supplier_id_idx";

ALTER TABLE "products"
  DROP COLUMN IF EXISTS "supplier_id";

DROP TABLE IF EXISTS "suppliers";
DROP TABLE IF EXISTS "banners";


-- =========================================================
-- 2. customer_preferences theo danh mục
-- =========================================================

ALTER TABLE "customer_preferences"
  ADD COLUMN IF NOT EXISTS "category_id" INTEGER;

-- Chỉ chuyển dữ liệu khi cột preference_tag còn tồn tại.
-- Ghép tên danh mục không phân biệt chữ hoa/chữ thường.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'customer_preferences'
      AND column_name = 'preference_tag'
  ) THEN
    EXECUTE '
      UPDATE "customer_preferences" cp
      SET "category_id" = c."category_id"
      FROM "categories" c
      WHERE LOWER(c."category_name") = LOWER(cp."preference_tag")
        AND cp."category_id" IS NULL
    ';
  END IF;
END $$;

-- Loại bỏ sở thích không khớp danh mục.
DELETE FROM "customer_preferences"
WHERE "category_id" IS NULL;

-- Loại bỏ các bản ghi trùng customer_id + category_id,
-- giữ lại bản ghi có preference_id nhỏ nhất.
DELETE FROM "customer_preferences" a
USING "customer_preferences" b
WHERE a."customer_id" = b."customer_id"
  AND a."category_id" = b."category_id"
  AND a."preference_id" > b."preference_id";

ALTER TABLE "customer_preferences"
  ALTER COLUMN "category_id" SET NOT NULL;

-- Chỉ xóa preference_tag nếu cột vẫn còn.
ALTER TABLE "customer_preferences"
  DROP COLUMN IF EXISTS "preference_tag";

-- Tạo foreign key nếu chưa tồn tại.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'customer_preferences_category_id_fkey'
      AND conrelid = '"customer_preferences"'::regclass
  ) THEN
    ALTER TABLE "customer_preferences"
      ADD CONSTRAINT "customer_preferences_category_id_fkey"
      FOREIGN KEY ("category_id")
      REFERENCES "categories"("category_id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS
  "customer_preferences_customer_id_category_id_key"
  ON "customer_preferences"("customer_id", "category_id");

CREATE INDEX IF NOT EXISTS
  "customer_preferences_category_id_idx"
  ON "customer_preferences"("category_id");


-- =========================================================
-- 3. Bảng employees
-- =========================================================

-- Nếu bảng chưa tồn tại thì tạo mới.
-- Nếu đã tồn tại từ migration trước, không tạo lại bảng.
CREATE TABLE IF NOT EXISTS "employees" (
    "employee_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(10),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" VARCHAR(255),
    "position" VARCHAR(100),
    "hire_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employee_id")
);

-- Bổ sung các cột mà bảng được tạo từ migration cũ có thể thiếu.
ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(100);

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "date_of_birth" DATE;

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10);

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20);

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "email" VARCHAR(100);

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "address" VARCHAR(255);

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "position" VARCHAR(100);

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "hire_date" DATE
  NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3)
  NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3)
  NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Nếu employee_code được tạo từ migration cũ thì giữ nguyên.
-- Không xóa cột này vì có thể schema Prisma vẫn đang sử dụng.

-- Tạo unique index cho email nếu chưa có.
CREATE UNIQUE INDEX IF NOT EXISTS "employees_email_key"
  ON "employees"("email");

-- Đảm bảo employee_id tham chiếu accounts.account_id.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'employees_employee_id_fkey'
      AND conrelid = '"employees"'::regclass
  ) THEN
    ALTER TABLE "employees"
      ADD CONSTRAINT "employees_employee_id_fkey"
      FOREIGN KEY ("employee_id")
      REFERENCES "accounts"("account_id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;


-- =========================================================
-- 4. Tạo hồ sơ cho Admin/Manager chưa có hồ sơ
-- =========================================================

-- Nếu employees có employee_code NOT NULL từ migration cũ,
-- tự tạo mã nhân viên. Nếu không có cột này, bỏ qua nó.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'employees'
      AND column_name = 'employee_code'
  ) THEN
    EXECUTE $sql$
      INSERT INTO "employees"
        ("employee_id", "employee_code", "full_name",
         "email", "position", "updated_at")
      SELECT
        a."account_id",
        LEFT('EMP' || a."account_id"::TEXT, 20),
        LEFT(a."username", 100),
        a."email",
        CASE r."role_name"
          WHEN 'Admin' THEN 'Quản trị viên hệ thống'
          ELSE 'Quản lý CRM'
        END,
        CURRENT_TIMESTAMP
      FROM "accounts" a
      JOIN "roles" r ON r."role_id" = a."role_id"
      WHERE r."role_name" IN ('Admin', 'Manager')
        AND NOT EXISTS (
          SELECT 1
          FROM "employees" e
          WHERE e."employee_id" = a."account_id"
        )
      ON CONFLICT ("employee_id") DO NOTHING
    $sql$;
  ELSE
    INSERT INTO "employees"
      ("employee_id", "full_name", "email", "position", "updated_at")
    SELECT
      a."account_id",
      LEFT(a."username", 100),
      a."email",
      CASE r."role_name"
        WHEN 'Admin' THEN 'Quản trị viên hệ thống'
        ELSE 'Quản lý CRM'
      END,
      CURRENT_TIMESTAMP
    FROM "accounts" a
    JOIN "roles" r ON r."role_id" = a."role_id"
    WHERE r."role_name" IN ('Admin', 'Manager')
      AND NOT EXISTS (
        SELECT 1
        FROM "employees" e
        WHERE e."employee_id" = a."account_id"
      )
    ON CONFLICT ("employee_id") DO NOTHING;
  END IF;
END $$;
