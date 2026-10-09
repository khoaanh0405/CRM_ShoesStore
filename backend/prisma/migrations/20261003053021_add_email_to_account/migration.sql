/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "email" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");
