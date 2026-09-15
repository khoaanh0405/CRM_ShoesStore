/**
 * Các lớp lỗi nghiệp vụ dùng chung cho Service layer.
 * Controller layer (chưa code) nên bắt AppError và map statusCode/code sang
 * response JSON tương ứng; lỗi không phải AppError (bug thật) thì để rơi
 * xuống error-handling middleware mặc định (500).
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** 404 — không tìm thấy bản ghi. */
export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy dữ liệu.') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** 400 — dữ liệu đầu vào không hợp lệ (validate trước khi chạm DB). */
export class ValidationError extends AppError {
  constructor(message = 'Dữ liệu không hợp lệ.') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/** 409 — xung đột dữ liệu: trùng unique, vi phạm FK khi xóa, đã tồn tại... */
export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu bị xung đột.') {
    super(message, 409, 'CONFLICT');
  }
}

/** 401 — sai thông tin đăng nhập / chưa xác thực. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Sai tên đăng nhập hoặc mật khẩu.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/** 403 — đã xác thực nhưng không có quyền thực hiện hành động này. */
export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.') {
    super(message, 403, 'FORBIDDEN');
  }
}
