import type { ChangePasswordPayload, CustomerPreference, CustomerProfile, UpdateProfilePayload } from '@/types/customer';
import { http } from './http';

export const customerService = {
  async getProfile(customerId: number): Promise<CustomerProfile> {
    const { data } = await http.get<CustomerProfile>(`/customers/${customerId}/profile`);
    return data;
  },
  async updateProfile(customerId: number, payload: UpdateProfilePayload): Promise<void> {
    await http.put(`/customers/${customerId}`, payload);
  },
  async listPreferences(customerId: number): Promise<CustomerPreference[]> {
    const { data } = await http.get<CustomerPreference[]>(`/customers/${customerId}/preferences`);
    return data;
  },
  async addPreference(customerId: number, preferenceTag: string): Promise<CustomerPreference> {
    const { data } = await http.post<CustomerPreference>(`/customers/${customerId}/preferences`, { preferenceTag });
    return data;
  },
  async removePreference(preferenceId: number): Promise<void> {
    await http.delete(`/preferences/${preferenceId}`);
  },
  async changePassword(accountId: number, payload: ChangePasswordPayload): Promise<void> {
    await http.patch(`/accounts/${accountId}/password`, payload);
  },
};
