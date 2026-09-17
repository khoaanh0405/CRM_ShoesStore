/**
 * Hằng số nghiệp vụ cho xác thực/mật khẩu — dùng trong account.service.js
 * và utils/hash.util.js. Đây là quy tắc nghiệp vụ (không đến từ .env) nên
 * đặt ở constants, không phải config.
 */
export const SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 6;
