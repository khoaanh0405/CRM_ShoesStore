/**
 * Bộ dựng middleware validate dùng chung cho toàn bộ validators/.
 *
 * PHẠM VI: chỉ kiểm tra HÌNH DẠNG dữ liệu đầu vào (có mặt / đúng kiểu /
 * đúng tập giá trị / độ dài). KHÔNG kiểm tra nghiệp vụ (bản ghi có tồn tại
 * không, khách hàng đã nộp khảo sát chưa, FK có hợp lệ không...) — những
 * thứ đó vẫn thuộc Service, tránh trùng lặp logic ở 2 nơi.
 *
 * Lợi ích: chặn dữ liệu rác ngay trước Controller, và gom TẤT CẢ lỗi trong
 * 1 lần trả về thay vì báo từng lỗi một như Service.
 */
import { ValidationError } from '../errors/AppError.js';

const TYPE_CHECKERS = {
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))),
  int: (v) => Number.isInteger(Number(v)) && String(v).trim() !== '',
  boolean: (v) => typeof v === 'boolean' || v === 'true' || v === 'false',
  array: (v) => Array.isArray(v),
  date: (v) => !Number.isNaN(new Date(v).getTime()),
  object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
};

function checkField(field, value, rule, errors) {
  const isMissing = value === undefined || value === null || (typeof value === 'string' && !value.trim());

  if (isMissing) {
    if (rule.required) errors.push(`Trường "${field}" là bắt buộc.`);
    return; // Không required và không truyền -> bỏ qua các check còn lại.
  }

  if (rule.type && !TYPE_CHECKERS[rule.type](value)) {
    errors.push(`Trường "${field}" phải có kiểu ${rule.type}.`);
    return; // Sai kiểu rồi thì các check min/max bên dưới vô nghĩa.
  }

  if (rule.minLength !== undefined && String(value).trim().length < rule.minLength) {
    errors.push(`Trường "${field}" phải có ít nhất ${rule.minLength} ký tự.`);
  }
  if (rule.maxLength !== undefined && String(value).trim().length > rule.maxLength) {
    errors.push(`Trường "${field}" không được vượt quá ${rule.maxLength} ký tự.`);
  }
  if (rule.min !== undefined && Number(value) < rule.min) {
    errors.push(`Trường "${field}" phải lớn hơn hoặc bằng ${rule.min}.`);
  }
  if (rule.max !== undefined && Number(value) > rule.max) {
    errors.push(`Trường "${field}" phải nhỏ hơn hoặc bằng ${rule.max}.`);
  }
  if (rule.enum && !rule.enum.includes(value)) {
    errors.push(`Trường "${field}" chỉ chấp nhận: ${rule.enum.join(', ')}.`);
  }
  if (rule.minItems !== undefined && Array.isArray(value) && value.length < rule.minItems) {
    errors.push(`Trường "${field}" phải có ít nhất ${rule.minItems} phần tử.`);
  }
  if (rule.itemType && Array.isArray(value)) {
    const badIndex = value.findIndex((item) => !TYPE_CHECKERS[rule.itemType](item));
    if (badIndex !== -1) {
      errors.push(`Phần tử thứ ${badIndex + 1} của "${field}" phải có kiểu ${rule.itemType}.`);
    }
  }
}

/** Tạo middleware validate cho req.body theo bảng rule. */
export function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body ?? {};
    for (const [field, rule] of Object.entries(rules)) {
      checkField(field, body[field], rule, errors);
    }
    if (errors.length) return next(new ValidationError(errors.join(' ')));
    next();
  };
}

/** Tạo middleware validate cho req.query (dùng cho các endpoint lọc/tìm kiếm). */
export function validateQuery(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      checkField(field, req.query[field], rule, errors);
    }
    if (errors.length) return next(new ValidationError(errors.join(' ')));
    next();
  };
}

/**
 * Validate các tham số trên URL (:id, :surveyId...). Mặc định mọi param
 * trong danh sách phải là số nguyên dương — khớp với kiểu Int của mọi khóa
 * chính trong schema.prisma.
 */
export function validateParams(...paramNames) {
  return (req, res, next) => {
    const errors = [];
    for (const name of paramNames) {
      const num = Number(req.params[name]);
      if (!Number.isInteger(num) || num <= 0) {
        errors.push(`Tham số "${name}" trên URL phải là số nguyên dương.`);
      }
    }
    if (errors.length) return next(new ValidationError(errors.join(' ')));
    next();
  };
}
