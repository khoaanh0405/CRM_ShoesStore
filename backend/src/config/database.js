import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

// Cấu hình mức độ log dựa trên môi trường
const logLevels = config.nodeEnv === 'development' 
  ? ['query', 'info', 'warn', 'error'] 
  : ['error'];

// Khởi tạo Singleton Instance cho Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
  log: logLevels,
});

// Thêm hàm kiểm tra kết nối CSDL (dùng khi startup app trong server.js)
export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Kết nối Database PostgreSQL (Neon) qua Prisma thành công!');
  } catch (error) {
    console.error('Kết nối Database thất bại:', error.message);
    process.exit(1);
  }
};

export default prisma;