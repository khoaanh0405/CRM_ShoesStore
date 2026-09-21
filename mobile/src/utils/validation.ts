/**
 * Validate phía client, đồng bộ với backend/src/validators/account.validator.js
 * và backend/src/constants/auth.constant.js. Đây chỉ là lớp UX (báo lỗi sớm,
 * không cần round-trip lên server) — server vẫn luôn validate lại, không được bỏ.
 */

/** backend/src/constants/auth.constant.js#MIN_PASSWORD_LENGTH */
export const MIN_PASSWORD_LENGTH = 6;

function isBlank(value?: string | null): boolean {
  return !value || !value.trim();
}

export function validateUsername(value: string): string | null {
  if (isBlank(value)) return 'Vui lòng nhập tên đăng nhập.';
  if (value.trim().length > 50) return 'Tên đăng nhập tối đa 50 ký tự.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (isBlank(value)) return 'Vui lòng nhập mật khẩu.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  return null;
}

export function validateFullName(value: string): string | null {
  if (isBlank(value)) return 'Vui lòng nhập họ tên.';
  if (value.trim().length > 100) return 'Họ tên tối đa 100 ký tự.';
  return null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateOfBirth(value: string): string | null {
  if (isBlank(value)) return 'Vui lòng nhập ngày sinh.';
  if (!DATE_RE.test(value.trim())) {
    return 'Ngày sinh theo định dạng YYYY-MM-DD (vd: 2003-05-20).';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ngày sinh không hợp lệ.';
  if (date.getTime() > Date.now()) return 'Ngày sinh không được ở tương lai.';
  return null;
}

export function validatePhone(value?: string): string | null {
  if (isBlank(value)) return null; // phone không bắt buộc (account.validator.js)
  if (!/^[0-9+\-\s]{8,20}$/.test(value!.trim())) return 'Số điện thoại không hợp lệ.';
  return null;
}
