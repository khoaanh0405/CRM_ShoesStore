/**
 * Ép tham số route (req.params luôn là string) sang số nguyên và báo lỗi
 * nghiệp vụ rõ ràng nếu không hợp lệ — dùng chung ở cả 13 Controller, tránh
 * để chuỗi "abc" rơi xuống Prisma rồi văng lỗi khó hiểu.
 * Cũng dùng cho query string dạng số (minPrice, roleId...).
 */
import { ValidationError } from '../errors/AppError.js';

export function parseId(value, fieldName = 'id') {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new ValidationError(`Tham số "${fieldName}" phải là số nguyên dương.`);
  }
  return num;
}

/** Ép query string 'true'/'false' sang boolean; trả undefined nếu không truyền. */
export function parseBoolean(value) {
  if (value === undefined || value === '') return undefined;
  return value === 'true' || value === true;
}

/** Ép query string sang số; trả undefined nếu không truyền (dùng cho filter giá). */
export function parseNumber(value) {
  if (value === undefined || value === '') return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}
