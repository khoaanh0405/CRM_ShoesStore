import type { CreateFeedbackPayload, Feedback, UpdateFeedbackPayload } from '@/types/feedback';
import { http } from './http';

export const feedbackService = {
  async create(payload: CreateFeedbackPayload): Promise<Feedback> {
    const { data } = await http.post<Feedback>('/feedbacks', payload);
    return data;
  },
  async getById(feedbackId: number): Promise<Feedback> {
    const { data } = await http.get<Feedback>(`/feedbacks/${feedbackId}`);
    return data;
  },
  /** Chỉnh sửa đánh giá của mình — backend chỉ cho phép khi còn "Pending". */
  async update(feedbackId: number, payload: UpdateFeedbackPayload): Promise<Feedback> {
    const { data } = await http.put<Feedback>(`/feedbacks/${feedbackId}`, payload);
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