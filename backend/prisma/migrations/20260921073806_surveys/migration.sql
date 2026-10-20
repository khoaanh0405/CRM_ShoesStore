-- Nhóm khảo sát: surveys, survey_questions, survey_question_options,
-- survey_targets (đối tượng + chữ ký gửi), survey_responses, survey_answers.

-- CreateTable
CREATE TABLE "surveys" (
    "survey_id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "product_id" INTEGER,
    "created_by" INTEGER,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("survey_id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "question_id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "question_content" TEXT NOT NULL,
    "question_type" VARCHAR(20) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "survey_question_options" (
    "option_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_text" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("option_id")
);

-- CreateTable
CREATE TABLE "survey_targets" (
    "survey_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "sent_signature" VARCHAR(64),

    CONSTRAINT "survey_targets_pkey" PRIMARY KEY ("survey_id","customer_id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "response_id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("response_id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "answer_id" SERIAL NOT NULL,
    "response_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer_value" TEXT NOT NULL,
    "option_id" INTEGER,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("answer_id")
);

-- CreateIndex
CREATE INDEX "surveys_product_id_idx" ON "surveys"("product_id");

-- CreateIndex
CREATE INDEX "surveys_created_by_idx" ON "surveys"("created_by");

-- CreateIndex
CREATE INDEX "survey_questions_survey_id_idx" ON "survey_questions"("survey_id");

-- CreateIndex
CREATE INDEX "survey_question_options_question_id_idx" ON "survey_question_options"("question_id");

-- CreateIndex
CREATE INDEX "survey_responses_customer_id_idx" ON "survey_responses"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_survey_id_customer_id_key" ON "survey_responses"("survey_id", "customer_id");

-- CreateIndex
CREATE INDEX "survey_answers_question_id_idx" ON "survey_answers"("question_id");

-- CreateIndex
CREATE INDEX "survey_answers_option_id_idx" ON "survey_answers"("option_id");

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "accounts"("account_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("survey_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_targets" ADD CONSTRAINT "survey_targets_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("survey_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_targets" ADD CONSTRAINT "survey_targets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("survey_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("response_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "survey_question_options"("option_id") ON DELETE SET NULL ON UPDATE CASCADE;
