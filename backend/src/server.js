import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';

const startServer = async () => {
  // 1. Kiểm tra kết nối DB trước
  await connectDB();

  // 2. Lắng nghe Port
  app.listen(config.port, () => {
    console.log(`Server CRM đang chạy trên port ${config.port} [Mode: ${config.nodeEnv}]`);
  });
};

startServer();