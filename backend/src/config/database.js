import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from './env.js';

// Cấu hình mức độ log dựa trên môi trường
const logLevels = config.nodeEnv === 'development'
  ? ['query', 'info', 'warn', 'error']
  : ['error'];

/**
 * Dùng Prisma Driver Adapter (@prisma/adapter-pg) thay vì truyền
 * datasources.db.url trực tiếp — PHẢI đồng bộ với seed.js (seed.js đã tạo
 * pool + adapter theo đúng cách này). schema.prisma cũng không khai báo
 * `url = env("DATABASE_URL")` trong block datasource vì URL được cấp qua
 * adapter, không phải qua schema.
 */
const pool = new pg.Pool({ connectionString: config.databaseUrl });
const adapter = new PrismaPg(pool);

// Singleton Instance cho Prisma Client
const prisma = new PrismaClient({ adapter, log: logLevels });

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Kết nối Database PostgreSQL (Neon) qua Prisma thành công!');
  } catch (error) {
    console.error('Kết nối Database thất bại:', error.message);
    process.exit(1);
  }
};

/**
 * Đóng kết nối Prisma + pg Pool "sạch" khi server tắt (SIGINT/SIGTERM).
 * Quan trọng với Neon vì giới hạn số connection đồng thời khá thấp — nếu
 * không disconnect, pool cũ có thể bị treo và chiếm slot connection.
 */
export const disconnectDB = async () => {
  await prisma.$disconnect();
  await pool.end();
  console.log('Đã đóng kết nối Database.');
};

export default prisma;