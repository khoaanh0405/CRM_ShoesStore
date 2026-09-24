import type { AppNotification } from '@/types/notification';
import { http } from './http';

export const notificationService = {
  async listByCustomer(customerId: number): Promise<AppNotification[]> {
    const { data } = await http.get<AppNotification[]>(`/customers/${customerId}/notifications`);
    return data;
  },
  async countUnread(customerId: number): Promise<number> {
    const { data } = await http.get<{ count: number }>(`/customers/${customerId}/notifications/unread-count`);
    return data.count;
  },
  async markRead(notificationId: number): Promise<AppNotification> {
    const { data } = await http.patch<AppNotification>(`/notifications/${notificationId}/read`);
    return data;
  },
  async markAllRead(customerId: number): Promise<void> {
    await http.patch(`/customers/${customerId}/notifications/read-all`);
  },
};
