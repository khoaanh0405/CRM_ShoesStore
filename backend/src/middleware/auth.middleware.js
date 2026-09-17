/**
 * Xác thực (authenticate) và phân quyền (authorize) bằng JWT.
 *
 * Yêu cầu: npm install jsonwebtoken
 *
 * Luồng: client đăng nhập -> nhận token -> gửi kèm header
 *   Authorization: Bearer <token>
 * -> authenticate() verify token, gắn payload vào req.user
 * -> authorize('Admin') kiểm tra req.user.roleName có nằm trong danh sách
 *    role được phép không.
 *
 * req.user cũng chính là thứ customer.controller.js#updateProfile đọc để
 * chặn khách hàng sửa hồ sơ của người khác (req.user.customerId).
 */
import { verifyToken } from '../utils/index.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { ROLE_NAMES } from '../constants/index.js';

/** Bắt buộc phải đăng nhập. Gắn req.user = payload trong token. */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Thiếu token xác thực.'));
  }

  try {
    req.user = verifyToken(header.slice('Bearer '.length).trim());
    next();
  } catch {
    // Gộp chung token sai chữ ký / hết hạn / hỏng -> đều là 401.
    next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn.'));
  }
}

/**
 * Chỉ cho phép các role chỉ định. Luôn dùng SAU authenticate.
 * Ví dụ: router.delete('/:id', authenticate, authorize(ROLE_NAMES.ADMIN), ...)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError('Chưa xác thực.'));
    if (!allowedRoles.includes(req.user.roleName)) {
      return next(new ForbiddenError('Bạn không có quyền thực hiện thao tác này.'));
    }
    next();
  };
}

/** Lối tắt hay dùng nhất: chỉ Admin mới được vào. */
export const adminOnly = [authenticate, authorize(ROLE_NAMES.ADMIN)];
