import type { AxiosInstance } from 'axios';
import * as apiClientModule from './api-client';

/**
 * Axios instance dùng chung (đã tự gắn JWT trong services/api-client.ts).
 * Lấy theo cả 2 kiểu export (named `apiClient` hoặc default) để các service
 * bên dưới không phụ thuộc cách export cụ thể.
 */
const mod = apiClientModule as unknown as { apiClient?: AxiosInstance; default?: AxiosInstance };
const instance = mod.apiClient ?? mod.default;

if (!instance) {
  throw new Error('Không tìm thấy axios instance trong services/api-client.ts');
}

export const http: AxiosInstance = instance;
