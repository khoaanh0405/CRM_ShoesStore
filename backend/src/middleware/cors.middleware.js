/**
 * CORS tự viết, đọc origin từ config (.env CORS_ORIGIN, mặc định '*').
 *
 * LƯU Ý QUAN TRỌNG: mọi res.header(...) phải gọi TRƯỚC next()/res.sendStatus().
 * Bản cũ gọi res.header('Access-Control-Expose-Headers', ...) SAU next() —
 * lúc đó response đã được các middleware/route phía sau gửi xong (hoặc đang
 * gửi), Node ném lỗi "Cannot set headers after they are sent to the client"
 * (ERR_HTTP_HEADERS_SENT) trên MỌI request, khiến các trang gọi API (Survey,
 * Dashboard...) không nhận được dữ liệu ổn định. Sửa bằng cách set toàn bộ
 * header trước khi next().
 */
import { config } from '../config/env.js';

export function cors(req, res, next) {
  res.header('Access-Control-Allow-Origin', config.corsOrigin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Expose-Headers', 'Retry-After');

  // Preflight request: trả 204 ngay, không đi tiếp xuống route.
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

export default cors;
