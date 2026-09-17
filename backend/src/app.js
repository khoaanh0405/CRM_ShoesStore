import express from 'express';
import { cors, notFound, errorHandler } from './middleware/index.js';
import routes from './routes/index.js';

const app = express();

// Parse JSON body cho mọi request (bắt buộc để đọc req.body trong Controller).
app.use(express.json());

// CORS — cho phép React Web / React Native gọi vào.
app.use(cors);

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
