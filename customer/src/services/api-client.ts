import axios from 'axios';
import { API_BASE_URL, AUTH_ACCOUNT_KEY, AUTH_TOKEN_KEY } from '@/constants/config';

/** Phát ra khi server báo token sai/hết hạn — AuthProvider lắng nghe để đăng xuất và cho khách đăng nhập lại. */
export const AUTH_EXPIRED_EVENT = 'crm_shoesstore:auth-expired';

/**
 * Lỗi do chính ứng dụng tự ném ra (không phải lỗi từ server) mà message đã
 * viết sẵn cho người dùng đọc. getApiErrorMessage() sẽ hiển thị nguyên văn
 * message này thay vì câu mặc định.
 */
export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Tự gắn header Authorization từ localStorage. Đồng bộ với
 * context/AuthContext.tsx — phiên đăng nhập lưu ở localStorage (không phải
 * sessionStorage) để khách hàng còn đăng nhập sau khi đóng/mở lại trình
 * duyệt, chỉ mất khi bấm "Đăng xuất" hoặc token hết hạn.
 */
apiClient.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

/**
 * Token sai/hết hạn (backend trả 401 kèm thông báo về "token") => xóa phiên cũ và
 * phát sự kiện để app tự đăng xuất, thay vì để mọi trang báo "Không tải được dữ liệu".
 * Không đụng tới 401 khác (vd: sai mật khẩu cũ khi đổi mật khẩu, sai tài khoản khi đăng nhập).
 */
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const message = (error.response.data as { message?: string } | undefined)?.message ?? '';
      const hadSession = !!localStorage.getItem(AUTH_TOKEN_KEY);
      if (hadSession && /token/i.test(message)) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_ACCOUNT_KEY);
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT)); // chỉ phát 1 lần: các request sau thấy hết phiên nên bỏ qua
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string {
  if (error instanceof ClientError) return error.message;
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string } | undefined;
    if (body?.message) return body.message;
    if (error.code === 'ECONNABORTED') return 'Kết nối tới server quá lâu, vui lòng thử lại.';
    if (error.message === 'Network Error') {
      return 'Không thể kết nối tới server. Kiểm tra lại VITE_API_URL và mạng của bạn.';
    }
  }
  return fallback;
}

export default apiClient;
