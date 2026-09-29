-- AlterTable
ALTER TABLE "surveys" ADD COLUMN     "product_id" INTEGER;

-- CreateIndex
CREATE INDEX "surveys_product_id_idx" ON "surveys"("product_id");

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;
