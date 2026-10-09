import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

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
 * Token thiếu/sai/hết hạn (backend trả 401 kèm thông báo có chữ "token") => xóa phiên và
 * chuyển về trang đăng nhập. Không đụng tới các 401 khác như sai mật khẩu khi đăng nhập
 * hoặc sai mật khẩu cũ khi đổi mật khẩu.
 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const body = error.response.data as { code?: string; message?: string } | undefined;
      const message = body?.message ?? '';
      const hadSession = !!sessionStorage.getItem('token');
      // Token hết hạn/không hợp lệ, hoặc tài khoản đang đăng nhập vừa bị khóa -> đăng xuất về trang đăng nhập.
      if (hadSession && (/token/i.test(message) || body?.code === 'ACCOUNT_LOCKED')) {
        useAuthStore.getState().clear();
        if (window.location.pathname !== '/login') window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
