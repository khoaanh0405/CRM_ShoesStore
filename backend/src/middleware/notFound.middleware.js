/**
 * Bắt mọi request không khớp route nào ở trên. Đặt SAU toàn bộ route và
 * TRƯỚC errorHandler trong app.js.
 */
import { NotFoundError } from '../errors/AppError.js';

export function notFound(req, res, next) {
  next(new NotFoundError(`Không tìm thấy route: ${req.method} ${req.originalUrl}`));
}

export default notFound;
