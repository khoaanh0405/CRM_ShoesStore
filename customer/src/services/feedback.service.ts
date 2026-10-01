import type { CreateFeedbackPayload, Feedback } from '@/types/feedback';
import { http } from './http';

export const feedbackService = {
  async create(payload: CreateFeedbackPayload): Promise<Feedback> {
    const { data } = await http.post<Feedback>('/feedbacks', payload);
    return data;
  },
  async listByCustomer(customerId: number): Promise<Feedback[]> {
    const { data } = await http.get<Feedback[]>(`/customers/${customerId}/feedbacks`);
    return data;
  },
  /** Thu hồi đánh giá đang chờ duyệt (backend chỉ cho phép chủ sở hữu + trạng thái Pending). */
  async remove(feedbackId: number): Promise<void> {
    await http.delete(`/feedbacks/${feedbackId}`);
  },
};
