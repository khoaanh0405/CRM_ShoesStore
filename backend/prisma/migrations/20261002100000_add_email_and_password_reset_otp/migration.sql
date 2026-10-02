-- AlterTable: thêm email cho khách hàng (nullable để không làm hỏng dữ liệu cũ; API bắt buộc nhập)
ALTER TABLE "customers" ADD COLUMN "email" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateTable: OTP quên mật khẩu (lưu bản băm)
CREATE TABLE "password_reset_otps" (
    "otp_id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "otp_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_otps_pkey" PRIMARY KEY ("otp_id")
);

-- CreateIndex
CREATE INDEX "password_reset_otps_account_id_created_at_idx" ON "password_reset_otps"("account_id", "created_at");

-- AddForeignKey
ALTER TABLE "password_reset_otps" ADD CONSTRAINT "password_reset_otps_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;
