import type { AppNotification } from '@/types/notification';
import { http } from './http';
export const notificationService = {
  /** GET /customers/:id/notifications */
  async listByCustomer(customerId: number): Promise<AppNotification[]> {
    const { data } = await http.get<AppNotification[]>(`/customers/${customerId}/notifications`);
    return data;
  },
  /** GET /customers/:id/notifications/unread-count — dùng cho badge số trên chuông. */
  async countUnread(customerId: number): Promise<number> {
    const { data } = await http.get<{ count: number }>(
      `/customers/${customerId}/notifications/unread-count`
    );
    return data.count;
  },
  /** PATCH /notifications/:id/read */
  async markRead(notificationId: number): Promise<AppNotification> {
    const { data } = await http.patch<AppNotification>(`/notifications/${notificationId}/read`);
    return data;
  },
  /** PATCH /customers/:id/notifications/read-all */
  async markAllRead(customerId: number): Promise<void> {
    await http.patch(`/customers/${customerId}/notifications/read-all`);
  },
};
