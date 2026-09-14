/*
  Warnings:

  - A unique constraint covering the columns `[survey_id,customer_id]` on the table `survey_responses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "image_url" VARCHAR(500);

-- AlterTable
ALTER TABLE "survey_answers" ADD COLUMN     "option_id" INTEGER;

-- CreateTable
CREATE TABLE "survey_question_options" (
    "option_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_text" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("option_id")
);

-- CreateIndex
CREATE INDEX "survey_question_options_question_id_idx" ON "survey_question_options"("question_id");

-- CreateIndex
CREATE INDEX "customers_is_deleted_idx" ON "customers"("is_deleted");

-- CreateIndex
CREATE INDEX "feedbacks_customer_id_idx" ON "feedbacks"("customer_id");

-- CreateIndex
CREATE INDEX "feedbacks_product_id_idx" ON "feedbacks"("product_id");

-- CreateIndex
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "survey_answers_question_id_idx" ON "survey_answers"("question_id");

-- CreateIndex
CREATE INDEX "survey_answers_option_id_idx" ON "survey_answers"("option_id");

-- CreateIndex
CREATE INDEX "survey_questions_survey_id_idx" ON "survey_questions"("survey_id");

-- CreateIndex
CREATE INDEX "survey_responses_customer_id_idx" ON "survey_responses"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_survey_id_customer_id_key" ON "survey_responses"("survey_id", "customer_id");

-- AddForeignKey
ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "survey_question_options"("option_id") ON DELETE SET NULL ON UPDATE CASCADE;
