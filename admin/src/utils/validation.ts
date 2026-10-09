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
