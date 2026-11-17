/**
 * Kiểm tra dữ liệu form phía quản trị — khớp với backend (validation.util.js)
 * và web khách hàng (customer/src/utils/validation.ts).
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Email luôn gửi lên server ở dạng chữ thường, bỏ khoảng trắng đầu cuối. */
export const normalizeEmail = (v: string) => v.trim().toLowerCase();

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Vui lòng nhập email.';
  if (v.length > 100) return 'Email tối đa 100 ký tự.';
  if (!EMAIL_RE.test(v)) return 'Email không hợp lệ (vd: ten@gmail.com).';
  return null;
}

/** Mật khẩu khởi tạo cho khách hàng: tối thiểu 6 ký tự, có chữ hoa, chữ số, ký tự đặc biệt, không khoảng trắng. */
export function validateNewPassword(value: string, username?: string): string | null {
  if (!value) return 'Vui lòng nhập mật khẩu.';
  if (value.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự.';
  if (value.length > 50) return 'Mật khẩu tối đa 50 ký tự.';
  if (/\s/.test(value)) return 'Mật khẩu không được chứa khoảng trắng.';
  if (!/[A-Z]/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ hoa.';
  if (!/\d/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ số.';
  if (!/[^A-Za-z0-9\s]/.test(value)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (vd: @ # $ !).';
  if (username && value.toLowerCase() === username.trim().toLowerCase()) return 'Mật khẩu không được trùng tên đăng nhập.';
  return null;
}

export const PASSWORD_HINT = 'Tối thiểu 6 ký tự, gồm chữ hoa, chữ số và ký tự đặc biệt.';

/** Gộp nhiều khoảng trắng liên tiếp thành 1 và bỏ khoảng trắng đầu cuối. */
export const normalizeSpaces = (v: string) => v.trim().replace(/\s+/g, ' ');

/** SĐT gửi lên server: bỏ khoảng trắng, dấu chấm, gạch ngang. */
export const normalizePhone = (v: string) => v.replace(/[\s.-]/g, '');

const PHONE_RE = /^(?:0|\+?84)\d{9}$/;

/** SĐT không bắt buộc; nếu có thì phải là số di động/cố định Việt Nam hợp lệ (vd: 0912345678, +84912345678). */
export function validatePhone(value: string): string | null {
  const v = normalizePhone(value);
  if (!v) return null;
  if (!PHONE_RE.test(v)) return 'Số điện thoại không hợp lệ (vd: 0912345678).';
  return null;
}

const USERNAME_RE = /^[A-Za-z0-9._]+$/;

/** Tên đăng nhập mới: 4–50 ký tự, chỉ gồm chữ không dấu, số, dấu chấm và gạch dưới. */
export function validateNewUsername(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Vui lòng nhập tên đăng nhập.';
  if (v.length < 4) return 'Tên đăng nhập tối thiểu 4 ký tự.';
  if (v.length > 50) return 'Tên đăng nhập tối đa 50 ký tự.';
  if (!USERNAME_RE.test(v)) return 'Tên đăng nhập chỉ gồm chữ cái không dấu, số, dấu chấm và gạch dưới.';
  return null;
}

/** Ngày sinh (yyyy-mm-dd): bắt buộc, đúng định dạng, từ 1900-01-01 đến hết hôm nay. */
export function validateDateOfBirth(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Vui lòng nhập ngày sinh.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(new Date(`${v}T00:00:00`).getTime())) return 'Ngày sinh không hợp lệ.';
  if (v < '1900-01-01') return 'Ngày sinh không hợp lệ (từ năm 1900 trở đi).';
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  if (v > today) return 'Ngày sinh không được ở tương lai.';
  return null;
}
