/*
  Warnings:

  - You are about to drop the column `employee_id` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `employee_code` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `handled_at` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `handled_by` on the `feedbacks` table. All the data in the column will be lost.
  - You are about to drop the column `employee_id` on the `review_replies` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `first_name` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `review_replies` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_created_by_fkey";

-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_handled_by_fkey";

-- DropForeignKey
ALTER TABLE "review_replies" DROP CONSTRAINT "review_replies_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "surveys" DROP CONSTRAINT "surveys_created_by_fkey";

-- DropIndex
DROP INDEX "audit_logs_employee_id_idx";

-- DropIndex
DROP INDEX "customers_created_by_idx";

-- DropIndex
DROP INDEX "employees_employee_code_key";

-- DropIndex
DROP INDEX "review_replies_employee_id_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "employee_id",
ADD COLUMN     "actor_id" INTEGER;

-- customers
ALTER TABLE "customers" ADD COLUMN "first_name" VARCHAR(50), ADD COLUMN "last_name" VARCHAR(50);
UPDATE "customers" SET
  "first_name" = LEFT(COALESCE(substring(trim("full_name") from '\S+$'), ''), 50),
  "last_name"  = LEFT(trim(regexp_replace(trim("full_name"), '\s*\S+$', '')), 50);
ALTER TABLE "customers" ALTER COLUMN "first_name" SET NOT NULL, ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "customers" DROP COLUMN "full_name";

-- employees
ALTER TABLE "employees" ADD COLUMN "first_name" VARCHAR(50), ADD COLUMN "last_name" VARCHAR(50);
UPDATE "employees" SET
  "first_name" = LEFT(COALESCE(substring(trim("full_name") from '\S+$'), ''), 50),
  "last_name"  = LEFT(trim(regexp_replace(trim("full_name"), '\s*\S+$', '')), 50);
ALTER TABLE "employees" ALTER COLUMN "first_name" SET NOT NULL, ALTER COLUMN "last_name" SET NOT NULL;
ALTER TABLE "employees" DROP COLUMN "full_name";

-- AlterTable
ALTER TABLE "feedbacks" DROP COLUMN "handled_at",
DROP COLUMN "handled_by";

-- AlterTable
ALTER TABLE "review_replies" DROP COLUMN "employee_id",
ADD COLUMN     "account_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "review_replies_account_id_idx" ON "review_replies"("account_id");

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;
