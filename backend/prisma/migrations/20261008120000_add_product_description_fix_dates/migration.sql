-- Mô tả sản phẩm (hiển thị ở trang chi tiết bên customer)
ALTER TABLE "products" ADD COLUMN "description" TEXT;

-- Sửa dữ liệu cũ có created_at nằm ở tương lai (làm đánh giá/khảo sát mới tạo bị đẩy xuống dưới)
UPDATE "feedbacks" SET "created_at" = LEAST("created_at", (NOW() AT TIME ZONE 'UTC'));
UPDATE "surveys"   SET "created_at" = LEAST("created_at", (NOW() AT TIME ZONE 'UTC'));