CREATE TABLE "roles" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("role_id")
);

CREATE TABLE "accounts" (
    "account_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role_id" INTEGER NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("account_id")
);

CREATE TABLE "suppliers" (
    "supplier_id" SERIAL NOT NULL,
    "supplier_name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" VARCHAR(255),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("supplier_id")
);

CREATE TABLE "products" (
    "product_id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "product_name" VARCHAR(150) NOT NULL,
    "category" VARCHAR(50),
    "brand" VARCHAR(50),
    "size" VARCHAR(10),
    "color" VARCHAR(30),
    "material" VARCHAR(50),
    "price" DECIMAL(18,2) NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "products_pkey" PRIMARY KEY ("product_id")
);

CREATE TABLE "customers" (
    "customer_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "gender" VARCHAR(10),
    "phone" VARCHAR(20),
    "address" VARCHAR(255),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

CREATE TABLE "customer_preferences" (
    "preference_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "preference_tag" VARCHAR(100) NOT NULL,

    CONSTRAINT "customer_preferences_pkey" PRIMARY KEY ("preference_id")
);

CREATE TABLE "feedbacks" (
    "feedback_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "image_url" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("feedback_id")
);

CREATE TABLE "surveys" (
    "survey_id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("survey_id")
);
 
CREATE TABLE "survey_questions" (
    "question_id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "question_content" TEXT NOT NULL,
    "question_type" VARCHAR(20) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("question_id")
);

 
CREATE TABLE "survey_targets" (
    "survey_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "survey_targets_pkey" PRIMARY KEY ("survey_id","customer_id")
);

CREATE TABLE "survey_responses" (
    "response_id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("response_id")
);

CREATE TABLE "survey_answers" (
    "answer_id" SERIAL NOT NULL,
    "response_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "answer_value" TEXT NOT NULL,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("answer_id")
);


CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

CREATE UNIQUE INDEX "accounts_username_key" ON "accounts"("username");

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customers" ADD CONSTRAINT "customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_preferences" ADD CONSTRAINT "customer_preferences_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("survey_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_targets" ADD CONSTRAINT "survey_targets_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("survey_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_targets" ADD CONSTRAINT "survey_targets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("survey_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "survey_responses"("response_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customers" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "products" ADD COLUMN     "image_url" VARCHAR(500);

ALTER TABLE "survey_answers" ADD COLUMN     "option_id" INTEGER;

 
CREATE TABLE "survey_question_options" (
    "option_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_text" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "survey_question_options_pkey" PRIMARY KEY ("option_id")
);


CREATE INDEX "survey_question_options_question_id_idx" ON "survey_question_options"("question_id");


CREATE INDEX "customers_is_deleted_idx" ON "customers"("is_deleted");


CREATE INDEX "feedbacks_customer_id_idx" ON "feedbacks"("customer_id");


CREATE INDEX "feedbacks_product_id_idx" ON "feedbacks"("product_id");


CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");


CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");


CREATE INDEX "products_category_idx" ON "products"("category");


CREATE INDEX "products_is_active_idx" ON "products"("is_active");


CREATE INDEX "survey_answers_question_id_idx" ON "survey_answers"("question_id");


CREATE INDEX "survey_answers_option_id_idx" ON "survey_answers"("option_id");


CREATE INDEX "survey_questions_survey_id_idx" ON "survey_questions"("survey_id");


CREATE INDEX "survey_responses_customer_id_idx" ON "survey_responses"("customer_id");


CREATE UNIQUE INDEX "survey_responses_survey_id_customer_id_key" ON "survey_responses"("survey_id", "customer_id");

ALTER TABLE "survey_question_options" ADD CONSTRAINT "survey_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "survey_question_options"("option_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
