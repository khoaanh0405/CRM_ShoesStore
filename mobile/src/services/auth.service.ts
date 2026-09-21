import { apiClient } from './api-client';
import type { Account, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';

/**
 * Khớp 1-1 với backend/src/routes/account.routes.js:
 * - POST /accounts/register  (công khai)
 * - POST /accounts/login     (công khai)
 * - PATCH /accounts/:id/password (yêu cầu đăng nhập)
 */
export const authService = {
  /** Khách hàng tự đăng ký — tạo Account + Customer (mục 4.3.1). Không trả token. */
  async register(payload: RegisterPayload): Promise<Account> {
    const { data } = await apiClient.post<Account>('/accounts/register', payload);
    return data;
  },

  /** Đăng nhập (mục 4.3.2) — trả về { token, account }. */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/accounts/login', payload);
    return data;
  },

  async changePassword(
    accountId: number,
    payload: { oldPassword: string; newPassword: string }
  ): Promise<Account> {
    const { data } = await apiClient.patch<Account>(`/accounts/${accountId}/password`, payload);
    return data;
  },
};

export default authService;
