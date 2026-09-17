/**
 * Ký và xác thực JWT. Secret/hạn dùng lấy từ config (đọc .env), KHÔNG
 * hard-code trong source. Chỉ là lớp bọc mỏng quanh jsonwebtoken để
 * middleware auth và account.controller dùng chung một cấu hình.
 *
 * Yêu cầu: npm install jsonwebtoken
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * payload nên gọn, chỉ chứa thứ cần cho phân quyền:
 * { accountId, username, roleName, customerId? }
 * Tuyệt đối không nhét passwordHash hay dữ liệu nhạy cảm vào token.
 */
export function signToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

/** Throw nếu token sai chữ ký/hết hạn — middleware auth bắt và đổi thành 401. */
export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
