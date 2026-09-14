import dotenv from 'dotenv';
import path from 'path';

// Nạp file .env từ thư mục gốc dự án
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  // Cấu hình Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Cấu hình Database (Neon PostgreSQL via Prisma)
  databaseUrl: process.env.DATABASE_URL,

  // Cấu hình JWT (Xác thực người dùng)
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  // Cấu hình CORS (cho phép React Native / React Web truy cập)
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

// Kiểm tra bắt buộc biến DATABASE_URL phải tồn tại
if (!config.databaseUrl) {
  console.error('LỖI NGHIÊM TRỌNG: DATABASE_URL chưa được định nghĩa trong file .env!');
  process.exit(1);
}