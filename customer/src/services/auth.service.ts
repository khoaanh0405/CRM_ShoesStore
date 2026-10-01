import { apiClient } from './api-client';
import type { Account, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';

export type ForgotPasswordPayload = {
  username: string;
  dateOfBirth: string;
  phone: string;
  newPassword: string;
};

export const authService = {
  async register(payload: RegisterPayload): Promise<Account> {
    const { data } = await apiClient.post<Account>('/accounts/register', payload);
    return data;
  },
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/accounts/login', payload);
    return data;
  },
  async changePassword(accountId: number, payload: { oldPassword: string; newPassword: string }): Promise<Account> {
    const { data } = await apiClient.patch<Account>(`/accounts/${accountId}/password`, payload);
    return data;
  },
  /** Quên mật khẩu: xác minh username + ngày sinh + SĐT rồi đặt mật khẩu mới (endpoint công khai). */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await apiClient.post('/accounts/forgot-password', payload);
  },
};
export default authService;
