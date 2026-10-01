/**
 * Xác thực (authenticate) và phân quyền (authorize) bằng JWT.
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
    next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn.'));
  }
}

/**
 * Xác thực "mềm": nếu có token hợp lệ thì gắn req.user, nếu không có/token
 * sai thì vẫn cho đi tiếp (req.user = undefined) — dùng cho các endpoint
 * công khai nhưng muốn biết thêm danh tính nếu có, ví dụ heartbeat presence
 * (khách chưa đăng nhập ở trang login/register vẫn được tính "đang online").
 */
export function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice('Bearer '.length).trim());
    } catch {
      req.user = undefined;
    }
  }
  next();
}

/**
 * Chỉ cho phép các role chỉ định. Luôn dùng SAU authenticate.
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

export const adminOnly = [authenticate, authorize(ROLE_NAMES.ADMIN)];
export const managerOnly = [authenticate, authorize(ROLE_NAMES.MANAGER)];
export const staffOnly = [authenticate, authorize(ROLE_NAMES.ADMIN, ROLE_NAMES.MANAGER)];
