/**
 * Hằng số nghiệp vụ cho xác thực/mật khẩu — dùng trong account.service.js
 * và utils/hash.util.js. Đây là quy tắc nghiệp vụ (không đến từ .env) nên
 * đặt ở constants, không phải config.
 */
export const SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 50;

/**
 * Mã lỗi (response.code) để web admin/web khách hàng nhận biết trạng thái tài khoản
 * và tự hiện alert + đăng xuất. Phải khớp với web-admin/src/utils/accountStatus.ts.
 */
export const ACCOUNT_LOCKED_CODE = 'ACCOUNT_LOCKED';
export const ACCOUNT_DELETED_CODE = 'ACCOUNT_DELETED';
export const ROLE_CHANGED_CODE = 'ROLE_CHANGED';
