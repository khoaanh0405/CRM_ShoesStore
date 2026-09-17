/**
 * CORS tự viết, đọc origin từ config (.env CORS_ORIGIN, mặc định '*') —
 * đủ dùng cho React Web/React Native gọi vào, không cần cài thêm package
 * "cors". Nếu sau này cần credentials/nhiều origin động thì thay bằng
 * package cors chính thức.
 */
import { config } from '../config/env.js';

export function cors(req, res, next) {
  res.header('Access-Control-Allow-Origin', config.corsOrigin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Preflight request: trả 204 ngay, không đi tiếp xuống route.
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

export default cors;
