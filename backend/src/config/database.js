import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from './env.js';

// Cấu hình mức độ log dựa trên môi trường
const logLevels = config.nodeEnv === 'development'
  ? ['query', 'info', 'warn', 'error']
  : ['error'];

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

export const disconnectDB = async () => {
  await prisma.$disconnect();
  await pool.end();
  console.log('Đã đóng kết nối Database.');
};

export default prisma;