/**
 * Xác thực (authenticate) và phân quyền (authorize) bằng JWT.
 *
 * req.user cũng chính là thứ customer.controller.js#updateProfile đọc để
 * chặn khách hàng sửa hồ sơ của người khác (req.user.customerId).
 */
import prisma from '../config/database.js';
import { verifyToken } from '../utils/index.js';
import { AppError, UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { ROLE_NAMES } from '../constants/index.js';

/** Mã lỗi để frontend nhận biết "tài khoản vừa bị khóa" và tự đăng xuất người dùng. */
export const ACCOUNT_LOCKED_CODE = 'ACCOUNT_LOCKED';

/**
 * Bắt buộc phải đăng nhập. Gắn req.user = payload trong token.
 * Ngoài việc kiểm tra chữ ký token, mỗi request còn tra lại trạng thái tài khoản trong CSDL
 * để tài khoản bị khóa (hoặc khách hàng bị xóa) mất quyền NGAY, không phải chờ token hết hạn.
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Thiếu token xác thực.'));
  }

  let payload;
  try {
    payload = verifyToken(header.slice('Bearer '.length).trim());
  } catch {
    return next(new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn.'));
  }

  try {
    const account = await prisma.account.findUnique({
      where: { accountId: payload.accountId },
      select: { isLocked: true, customer: { select: { isDeleted: true } } },
    });

    if (!account) {
      return next(new UnauthorizedError('Token không hợp lệ: tài khoản không còn tồn tại.'));
    }
    if (account.isLocked) {
      return next(new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 401, ACCOUNT_LOCKED_CODE));
    }
    if (account.customer?.isDeleted) {
      return next(new AppError('Tài khoản khách hàng không còn tồn tại.', 401, ACCOUNT_LOCKED_CODE));
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
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
