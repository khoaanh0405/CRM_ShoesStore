/**
 * Error-handling middleware trung tâm — PHẢI khai đủ 4 tham số
 * (err, req, res, next) để Express nhận diện là error handler.
 *
 * Đây là nơi duy nhất quyết định HTTP status trả về cho lỗi:
 * - AppError (và các lớp con: NotFoundError 404, ValidationError 400,
 *   ConflictError 409, UnauthorizedError 401, ForbiddenError 403) đã mang
 *   sẵn statusCode/code -> map thẳng ra response.
 * - Lỗi Prisma lọt qua Service chưa kịp bắt -> dịch sang thông báo dễ hiểu.
 * - Còn lại là bug thật -> log ra console và trả 500 chung chung, KHÔNG lộ
 *   stack trace ra client ở môi trường production.
 */
import { AppError } from '../errors/AppError.js';
import { config } from '../config/env.js';

/** Map một số mã lỗi Prisma hay gặp sang HTTP status + thông báo tiếng Việt. */
const PRISMA_ERROR_MAP = {
  P2002: { statusCode: 409, code: 'CONFLICT', message: 'Dữ liệu đã tồn tại (trùng giá trị duy nhất).' },
  P2003: { statusCode: 409, code: 'CONFLICT', message: 'Không thể thực hiện vì dữ liệu đang được tham chiếu ở bảng khác.' },
  P2025: { statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi cần thao tác.' },
};

export function errorHandler(err, req, res, next) {
  // Lỗi nghiệp vụ do Service/Validator chủ động ném ra.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ code: err.code, message: err.message });
  }

  // Lỗi Prisma chưa được Service xử lý riêng.
  const prismaMapped = err?.code ? PRISMA_ERROR_MAP[err.code] : undefined;
  if (prismaMapped) {
    return res.status(prismaMapped.statusCode).json({
      code: prismaMapped.code,
      message: prismaMapped.message,
    });
  }

  // JSON body sai cú pháp (express.json() ném ra).
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'JSON gửi lên không đúng định dạng.' });
  }

  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Đã có lỗi xảy ra ở server.',
    // Chỉ lộ chi tiết khi đang dev, để debug cho nhanh.
    ...(config.nodeEnv === 'development' && { detail: err?.message }),
  });
}

export default errorHandler;
