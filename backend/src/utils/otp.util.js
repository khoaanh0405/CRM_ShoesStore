/**
 * Sinh / băm / so khớp mã OTP. OTP chỉ được lưu dưới dạng HMAC-SHA256
 * (khóa = JWT secret, kèm accountId) nên dù lộ DB cũng không đọc được mã gốc.
 */
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { OTP_LENGTH } from '../constants/auth.constant.js';

export function generateOtp() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

export function hashOtp(accountId, otp) {
  return createHmac('sha256', config.jwt.secret).update(`${accountId}:${otp}`).digest('hex');
}

export function verifyOtpHash(accountId, otp, storedHash) {
  const a = Buffer.from(hashOtp(accountId, String(otp ?? '')), 'hex');
  const b = Buffer.from(String(storedHash ?? ''), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
