import { apiClient } from './api-client';
import type { Account, LoginPayload, LoginResponse, RegisterPayload } from '@/types/auth';

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
};
export default authService;
