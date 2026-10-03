-- CreateTable
CREATE TABLE "banners" (
    "banner_id" SERIAL NOT NULL,
    "image_url" TEXT NOT NULL,
    "title" VARCHAR(150),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("banner_id")
);
