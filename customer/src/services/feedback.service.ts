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
};
