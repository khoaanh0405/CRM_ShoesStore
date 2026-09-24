import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '@/constants/config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Tự gắn header Authorization từ localStorage (thay cho expo-secure-store ở bản mobile). */
apiClient.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

export function getApiErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string {
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
