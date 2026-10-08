import { apiClient } from './api-client';
import type { Account, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';

export type ResetPasswordPayload = {
  email: string;
  otp: string;
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
  /** Quên mật khẩu — bước 1: gửi mã OTP 6 số tới email đã đăng ký (endpoint công khai). */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/accounts/forgot-password', { email });
  },
  /** Quên mật khẩu — bước 2: kiểm tra mã OTP (đúng mới được nhập mật khẩu mới). */
  async verifyOtp(payload: { email: string; otp: string }): Promise<void> {
    await apiClient.post('/accounts/verify-otp', payload);
  },
  /** Quên mật khẩu — bước 3: nhập OTP + mật khẩu mới để đặt lại mật khẩu (endpoint công khai). */
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post('/accounts/reset-password', payload);
  },
};
export default authService;
