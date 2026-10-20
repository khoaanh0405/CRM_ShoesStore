-- Nhóm phản hồi sản phẩm: feedbacks (xóa mềm, rating 1-5) và review_replies (nhân sự trả lời).

-- CreateTable
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
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("feedback_id"),
    -- Prisma không mô tả được CHECK, nên ràng buộc này chỉ tồn tại trong SQL.
    CONSTRAINT "feedbacks_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

-- CreateTable
CREATE TABLE "review_replies" (
    "reply_id" SERIAL NOT NULL,
    "feedback_id" INTEGER NOT NULL,
    "account_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("reply_id")
);

-- CreateIndex
CREATE INDEX "feedbacks_customer_id_idx" ON "feedbacks"("customer_id");

-- CreateIndex
CREATE INDEX "feedbacks_product_id_idx" ON "feedbacks"("product_id");

-- CreateIndex
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");

-- CreateIndex
CREATE INDEX "review_replies_feedback_id_idx" ON "review_replies"("feedback_id");

-- CreateIndex
CREATE INDEX "review_replies_account_id_idx" ON "review_replies"("account_id");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedbacks"("feedback_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
