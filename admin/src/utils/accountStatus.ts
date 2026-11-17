// Thông báo + nhận diện lỗi "tài khoản bị khóa/xóa" / "đổi vai trò".
// Dùng chung cho trang đăng nhập, api.ts (interceptor) và useSessionWatcher.

// Giữ lại thông báo chung (các nơi khác như trang đăng nhập / useSessionWatcher vẫn import).
export const ACCOUNT_BLOCKED_MESSAGE = 'Tài khoản của bạn đã bị xóa hoặc khóa.';
export const ACCOUNT_LOCKED_MESSAGE = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
export const ACCOUNT_DELETED_MESSAGE = 'Tài khoản của bạn đã bị xóa.';
export const ROLE_CHANGED_MESSAGE = 'Vai trò của bạn đã bị thay đổi. Vui lòng đăng nhập lại.';

// Mã lỗi backend trả trong response.data.code
export const ACCOUNT_DELETED_CODE = 'ACCOUNT_DELETED';
export const BLOCKED_CODES = ['ACCOUNT_LOCKED', ACCOUNT_DELETED_CODE, 'ACCOUNT_DISABLED', 'ACCOUNT_INACTIVE'];
export const ROLE_CHANGED_CODE = 'ROLE_CHANGED';

const BLOCKED_MESSAGE_RE = /(kh[óo][áa]|bị\s*xo[áa]|bị\s*xóa|đã\s*xóa|đã\s*xoá|locked|deleted|disabled)/i;

export const errorCodeOf = (err: any): string => String(err?.response?.data?.code ?? '').toUpperCase();

/** Chọn thông báo theo mã lỗi: xóa -> "đã bị xóa", còn lại -> "đã bị khóa". */
export const blockedMessageOf = (code: string): string =>
  code === ACCOUNT_DELETED_CODE ? ACCOUNT_DELETED_MESSAGE : ACCOUNT_LOCKED_MESSAGE;

/** true nếu lỗi trả về từ API cho biết tài khoản đã bị khóa hoặc bị xóa. */
export const isAccountBlockedError = (err: any): boolean => {
  if (BLOCKED_CODES.includes(errorCodeOf(err))) return true;
  if (err?.response?.status === 403) return true;
  return BLOCKED_MESSAGE_RE.test(String(err?.response?.data?.message ?? ''));
};
