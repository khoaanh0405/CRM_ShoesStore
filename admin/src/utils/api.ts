import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import {
  BLOCKED_CODES,
  ROLE_CHANGED_CODE,
  ROLE_CHANGED_MESSAGE,
  blockedMessageOf,
  errorCodeOf,
} from '../utils/accountStatus';
import { forceLogout } from '../utils/forceLogout';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Khi đang có phiên đăng nhập (hadSession):
 *  - Tài khoản bị xóa (ACCOUNT_DELETED)   -> alert "Tài khoản của bạn đã bị xóa." + đăng xuất
 *  - Tài khoản bị khóa (ACCOUNT_LOCKED...) -> alert "đã bị khóa" + đăng xuất
 *  - Vai trò bị đổi (code ROLE_CHANGED)    -> alert + đăng xuất
 *  - Token thiếu/sai/hết hạn (401 có chữ "token") -> đăng xuất im lặng như cũ
 * Không đụng tới các 401 khác (sai mật khẩu khi đăng nhập / khi đổi mật khẩu):
 * lúc đăng nhập chưa có token nên hadSession = false và trang Login tự xử lý.
 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const hadSession = !!sessionStorage.getItem('token');
      const code = errorCodeOf(error);
      const message = (error.response.data as { message?: string } | undefined)?.message ?? '';

      if (hadSession && (status === 401 || status === 403)) {
        if (BLOCKED_CODES.includes(code)) {
          forceLogout(blockedMessageOf(code));
        } else if (code === ROLE_CHANGED_CODE) {
          forceLogout(ROLE_CHANGED_MESSAGE);
        } else if (status === 401 && /token/i.test(message)) {
          useAuthStore.getState().clear();
          if (window.location.pathname !== '/login') window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
