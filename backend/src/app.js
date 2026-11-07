import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { cors, notFound, errorHandler, softIdentify } from './middleware/index.js';
import routes from './routes/index.js';

const app = express();

// Tìm thư mục ảnh customer/assets/images bất kể chạy server từ thư mục nào.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imageDirCandidates = [
  path.resolve(__dirname, '../../customer/assets/images'), // app.js nằm ở backend/src
  path.resolve(__dirname, '../customer/assets/images'),    // app.js nằm ở backend
  path.resolve(process.cwd(), '../customer/assets/images'), // chạy từ backend/
  path.resolve(process.cwd(), 'customer/assets/images'),    // chạy từ thư mục gốc
];
const imagesPath = imageDirCandidates.find((p) => fs.existsSync(p)) ?? imageDirCandidates[0];
console.log('[static] Thư mục ảnh:', imagesPath);

app.use(
  '/images',
  (req, res, next) => {
    // Cho phép web (cổng khác) và mobile hiển thị ảnh từ backend.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
  express.static(imagesPath)
);

// Parse JSON body cho mọi request (bắt buộc để đọc req.body trong Controller).
app.use(express.json({ limit: '8mb' }));

// CORS — cho phép React Web / React Native gọi vào.
app.use(cors);
app.use(softIdentify);

/** Route test nhanh để kiểm tra server sống — gọi trong Insomnia: GET /health */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Toàn bộ API nghiệp vụ nằm dưới tiền tố /api.
app.use('/api', routes);

// 404 — không khớp route nào ở trên. PHẢI đặt sau toàn bộ route.
app.use(notFound);

// Error handler — PHẢI là middleware cuối cùng.
app.use(errorHandler);

export default app;