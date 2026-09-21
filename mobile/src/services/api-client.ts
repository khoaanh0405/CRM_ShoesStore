import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '@/constants/config';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Tự động gắn header "Authorization: Bearer <token>" cho mọi request —
 * đúng như auth.middleware.js#authenticate mong đợi. Token được đọc trực
 * tiếp từ SecureStore (không dùng state React) để service này dùng được
 * độc lập, không phụ thuộc AuthProvider.
 */
apiClient.interceptors.request.use(async (reqConfig) => {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  }
  return reqConfig;
});

/**
 * Backend luôn trả lỗi dạng { code, message } (xem
 * errorHandler.middleware.js), kể cả lỗi validate (400), sai đăng nhập
 * (401), trùng username (409)... Helper này rút message ra để hiển thị
 * thẳng lên Alert/UI thay vì "Network Error" chung chung của axios.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Có lỗi xảy ra, vui lòng thử lại.'
): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string } | undefined;
    if (body?.message) return body.message;
    if (error.code === 'ECONNABORTED') {
      return 'Kết nối tới server quá lâu, vui lòng thử lại.';
    }
    if (error.message === 'Network Error') {
      return 'Không thể kết nối tới server. Kiểm tra lại EXPO_PUBLIC_API_URL và mạng của bạn.';
    }
  }
  return fallback;
}

export default apiClient;
