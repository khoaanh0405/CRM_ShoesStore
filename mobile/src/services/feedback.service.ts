import type { CreateFeedbackPayload, Feedback } from '@/types/feedback';
import { http } from './http';

export const feedbackService = {
  /** POST /feedbacks — luôn tạo với status "Pending" (chờ Admin duyệt). */
  async create(payload: CreateFeedbackPayload): Promise<Feedback> {
    const { data } = await http.post<Feedback>('/feedbacks', payload);
    return data;
  },

  /** GET /customers/:id/feedbacks — lịch sử phản hồi của chính khách hàng. */
  async listByCustomer(customerId: number): Promise<Feedback[]> {
    const { data } = await http.get<Feedback[]>(`/customers/${customerId}/feedbacks`);
    return data;
  },
};
