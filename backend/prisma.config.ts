import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrations: {
    // Chỉ định đường dẫn tới file seed.js của bạn
    seed: 'node ./prisma/seeds/seed.js', 
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});