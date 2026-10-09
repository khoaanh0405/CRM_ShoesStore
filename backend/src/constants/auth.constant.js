/**
 * Hằng số nghiệp vụ cho xác thực/mật khẩu — dùng trong account.service.js
 * và utils/hash.util.js. Đây là quy tắc nghiệp vụ (không đến từ .env) nên
 * đặt ở constants, không phải config.
 */
export const SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 50;

/** Quên mật khẩu bằng OTP gửi qua email. */
export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;     // mã hết hạn sau 10 phút
export const OTP_MAX_ATTEMPTS = 5;     // nhập sai quá 5 lần -> mã bị hủy
export const OTP_RESEND_SECONDS = 60;  // giãn cách giữa 2 lần gửi mã cho cùng 1 tài khoản
