export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 50;
const MIN_AGE = 10;
const MAX_AGE = 120;

function isBlank(value?: string | null): boolean {
  return !value || !value.trim();
}

export const normalizeSpaces = (v: string) => v.trim().replace(/\s+/g, ' ');
export const normalizePhone = (v?: string | null) => (v ?? '').replace(/[\s.\-]/g, '');

/** Dùng cho form đăng nhập (không ép định dạng để không chặn tài khoản cũ). */
export function validateUsername(value: string): string | null {
  if (isBlank(value)) return 'Vui lòng nhập tên đăng nhập.';
  if (value.trim().length > 50) return 'Tên đăng nhập tối đa 50 ký tự.';
  return null;
}

/** Dùng cho form đăng nhập. */
export function validatePassword(value: string): string | null {
  if (isBlank(value)) return 'Vui lòng nhập mật khẩu.';
  if (value.length < MIN_PASSWORD_LENGTH) return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  return null;
}

/** Tên đăng nhập khi đăng ký tài khoản mới. */
export function validateNewUsername(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Vui lòng nhập tên đăng nhập.';
  if (v.length < 4) return 'Tên đăng nhập tối thiểu 4 ký tự.';
  if (v.length > 50) return 'Tên đăng nhập tối đa 50 ký tự.';
  if (!/^[A-Za-z0-9._]+$/.test(v)) return 'Chỉ gồm chữ cái không dấu, số, dấu chấm và gạch dưới.';
  if (/^[._]|[._]$/.test(v)) return 'Không bắt đầu/kết thúc bằng dấu chấm hoặc gạch dưới.';
  return null;
}

/** Quy tắc mật khẩu MỚI — dùng chung cho Đăng ký, Quên mật khẩu, Đổi mật khẩu (và checklist ở Hồ sơ). */
export const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'Ít nhất 6 ký tự', test: (v) => v.length >= MIN_PASSWORD_LENGTH },
  { label: 'Có chữ hoa', test: (v) => /[A-Z]/.test(v) },
  { label: 'Có chữ số', test: (v) => /\d/.test(v) },
  { label: 'Có ký tự đặc biệt', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

/** Mật khẩu mới (đăng ký, quên mật khẩu, đổi mật khẩu). */
export function validateNewPassword(value: string, username?: string): string | null {
  if (!value) return 'Vui lòng nhập mật khẩu.';
  if (value.length < MIN_PASSWORD_LENGTH) return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  if (value.length > MAX_PASSWORD_LENGTH) return `Mật khẩu tối đa ${MAX_PASSWORD_LENGTH} ký tự.`;
  if (/\s/.test(value)) return 'Mật khẩu không được chứa khoảng trắng.';
  if (!/[A-Z]/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ hoa.';
  if (!/\d/.test(value)) return 'Mật khẩu phải có ít nhất 1 chữ số.';
  if (!/[^A-Za-z0-9\s]/.test(value)) return 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (vd: @ # $ !).';
  if (username && value.toLowerCase() === username.trim().toLowerCase()) return 'Mật khẩu không được trùng tên đăng nhập.';
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Vui lòng nhập lại mật khẩu.';
  if (confirm !== password) return 'Mật khẩu nhập lại không khớp.';
  return null;
}

export function validateFullName(value: string): string | null {
  const v = normalizeSpaces(value);
  if (!v) return 'Vui lòng nhập họ tên.';
  if (v.length < 2) return 'Họ tên tối thiểu 2 ký tự.';
  if (v.length > 100) return 'Họ tên tối đa 100 ký tự.';
  if (!/^\p{L}[\p{L}\s'.-]*$/u.test(v)) return 'Họ tên chỉ gồm chữ cái và khoảng trắng.';
  return null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateOfBirth(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Vui lòng nhập ngày sinh.';
  if (!DATE_RE.test(v)) return 'Ngày sinh theo định dạng YYYY-MM-DD (vd: 2003-05-20).';
  const [y, m, d] = v.split('-').map(Number);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return 'Ngày sinh không hợp lệ.';
  const today = new Date();
  const dob = new Date(y, m - 1, d);
  if (dob.getTime() > today.getTime()) return 'Ngày sinh không được ở tương lai.';
  let age = today.getFullYear() - y;
  if (today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)) age -= 1;
  if (age < MIN_AGE) return `Bạn cần từ ${MIN_AGE} tuổi trở lên để đăng ký.`;
  if (age > MAX_AGE) return 'Ngày sinh không hợp lệ.';
  return null;
}

/** Không bắt buộc; nếu nhập phải là số di động VN (0xxxxxxxxx hoặc +84xxxxxxxxx). */
export function validatePhone(value?: string): string | null {
  if (isBlank(value)) return null;
  if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalizePhone(value))) return 'Số điện thoại không hợp lệ (vd: 0912345678).';
  return null;
}

/** Không bắt buộc; nếu nhập thì 5–255 ký tự. */
export function validateAddress(value?: string): string | null {
  const v = normalizeSpaces(value ?? '');
  if (!v) return null;
  if (v.length < 5) return 'Địa chỉ quá ngắn (tối thiểu 5 ký tự).';
  if (v.length > 255) return 'Địa chỉ tối đa 255 ký tự.';
  return null;
}
