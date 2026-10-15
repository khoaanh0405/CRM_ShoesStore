import type { CreateFeedbackPayload, Feedback, UpdateFeedbackPayload } from '@/types/feedback';
import { http } from './http';

export const feedbackService = {
  async create(payload: CreateFeedbackPayload): Promise<Feedback> { return (await http.post<Feedback>('/feedbacks', payload)).data; },
  async getById(feedbackId: number): Promise<Feedback> { return (await http.get<Feedback>(`/feedbacks/${feedbackId}`)).data; },
  async update(feedbackId: number, payload: UpdateFeedbackPayload): Promise<Feedback> { return (await http.put<Feedback>(`/feedbacks/${feedbackId}`, payload)).data; },
  async listByCustomer(customerId: number): Promise<Feedback[]> { return (await http.get<Feedback[]>(`/customers/${customerId}/feedbacks`)).data; },
  async remove(feedbackId: number): Promise<void> { await http.delete(`/feedbacks/${feedbackId}`); },
};
