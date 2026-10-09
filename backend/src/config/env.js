import dotenv from 'dotenv';
import path from 'path';

// Nạp file .env từ thư mục gốc dự án
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_JWT_SECRET = 'fallback_secret_key_change_in_production';
const mailProvider = (process.env.MAIL_PROVIDER || 'resend').toLowerCase();

export const config = {
  // Cấu hình Server
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Cấu hình Database (Neon PostgreSQL via Prisma driver adapter, xem database.js)
  databaseUrl: process.env.DATABASE_URL,

  // Cấu hình JWT (Xác thực người dùng)
  jwt: {
    secret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  // Cấu hình CORS (cho phép React Native / React Web truy cập)
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Cấu hình gửi email (OTP quên mật khẩu) — Resend hoặc Brevo
  mail: {
    provider: mailProvider,
    apiKey: (mailProvider === 'brevo' ? process.env.BREVO_API_KEY : process.env.RESEND_API_KEY) || '',
    fromEmail: process.env.MAIL_FROM_EMAIL || 'onboarding@resend.dev',
    fromName: process.env.MAIL_FROM_NAME || 'Ouran',
  },
};

// Kiểm tra bắt buộc biến DATABASE_URL phải tồn tại
if (!config.databaseUrl) {
  console.error('LỖI NGHIÊM TRỌNG: DATABASE_URL chưa được định nghĩa trong file .env!');
  process.exit(1);
}

// Cảnh báo (không chặn chạy) nếu quên đổi JWT_SECRET khi lên production —
// tránh trường hợp deploy thật mà vẫn ký token bằng secret mặc định công khai.
if (config.nodeEnv === 'production' && config.jwt.secret === DEFAULT_JWT_SECRET) {
  console.warn(
    'CẢNH BÁO: JWT_SECRET đang dùng giá trị mặc định ở môi trường production. Hãy đặt biến JWT_SECRET trong .env!'
  );
}

if (config.nodeEnv === 'production' && !config.mail.apiKey) {
  console.warn('CẢNH BÁO: Chưa cấu hình API key gửi email (RESEND_API_KEY / BREVO_API_KEY) — chức năng quên mật khẩu sẽ không gửi được mail.');
}
