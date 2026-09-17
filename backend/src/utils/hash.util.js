/**
 * Gom bcrypt hash/compare vào 1 chỗ — account.service.js là nơi DUY NHẤT
 * được phép đụng tới mật khẩu, nhưng logic "hash bằng bao nhiêu vòng muối"
 * và "so khớp" bị lặp lại 2 lần trong file đó (registerCustomer +
 * changePassword cho hash, login + changePassword cho compare). Tách ra
 * đây để không lặp lại, KHÔNG chứa business rule (business rule như "mật
 * khẩu tối thiểu 6 ký tự" vẫn nằm ở Service).
 */
import bcrypt from 'bcrypt';
import { SALT_ROUNDS } from '../constants/auth.constant.js';

export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}
