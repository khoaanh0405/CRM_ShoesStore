import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';

const startServer = async () => {
  // 1. Kiểm tra kết nối DB trước
  await connectDB();

  // 2. Lắng nghe Port
  const server = app.listen(config.port, () => {
    console.log(`Server CRM đang chạy trên port ${config.port} [Mode: ${config.nodeEnv}]`);
  });

  server.on('error', (error) => {
    if (error.syscall !== 'listen') throw error;
    if (error.code === 'EADDRINUSE') {
      console.error(`LỖI: Port ${config.port} đang bị sử dụng bởi một tiến trình khác.`);
      console.error('Vui lòng tắt server cũ (hoặc kill tiến trình Node) trước khi chạy lại.');
      process.exit(1);
    }
    throw error;
  });
};

startServer();
process.on('exit', (code) => console.log('Exiting with code:', code));
