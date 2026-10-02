/**
 * Kiểm tra định dạng dùng chung ở validators/ và services/ (email, mật khẩu mạnh).
 * Quy tắc mật khẩu PHẢI khớp với frontend (customer/src/utils/validation.ts):
 * tối thiểu 6 ký tự, có chữ hoa, có chữ số, có ký tự đặc biệt, không có khoảng trắng.
 */
import { ValidationError } from '../errors/AppError.js';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../constants/auth.constant.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const EMAIL_MAX_LENGTH = 100;

/** Email luôn lưu/so khớp ở dạng chữ thường, bỏ khoảng trắng đầu cuối. */
export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();

export function isValidEmail(email) {
  const e = normalizeEmail(email);
  return e.length > 0 && e.length <= EMAIL_MAX_LENGTH && EMAIL_REGEX.test(e);
}

/** Throw ValidationError nếu email sai định dạng; trả về email đã chuẩn hóa. */
export function assertValidEmail(email) {
  if (!isValidEmail(email)) throw new ValidationError('Email không hợp lệ.');
  return normalizeEmail(email);
}

/** Throw ValidationError nếu mật khẩu không đạt chuẩn mật khẩu mới. */
export function assertStrongPassword(password, username) {
  if (!password) throw new ValidationError('Vui lòng nhập mật khẩu.');
  if (password.length < MIN_PASSWORD_LENGTH) throw new ValidationError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
  if (password.length > MAX_PASSWORD_LENGTH) throw new ValidationError(`Mật khẩu tối đa ${MAX_PASSWORD_LENGTH} ký tự.`);
  if (/\s/.test(password)) throw new ValidationError('Mật khẩu không được chứa khoảng trắng.');
  if (!/[A-Z]/.test(password)) throw new ValidationError('Mật khẩu phải có ít nhất 1 chữ hoa.');
  if (!/\d/.test(password)) throw new ValidationError('Mật khẩu phải có ít nhất 1 chữ số.');
  if (!/[^A-Za-z0-9\s]/.test(password)) throw new ValidationError('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (vd: @ # $ !).');
  if (username && password.toLowerCase() === String(username).trim().toLowerCase()) {
    throw new ValidationError('Mật khẩu không được trùng tên đăng nhập.');
  }
}
