import type { SubmitSurveyPayload, SurveyFull, SurveyTarget } from '@/types/survey';
import { http } from './http';

export const surveyService = {
  /** GET /customers/:id/surveys — khảo sát Admin đã gán cho khách hàng. */
  async listByCustomer(customerId: number): Promise<SurveyTarget[]> {
    const { data } = await http.get<SurveyTarget[]>(`/customers/${customerId}/surveys`);
    return data;
  },

  /** GET /surveys/:id/full — khảo sát kèm câu hỏi + lựa chọn để hiển thị form. */
  async getFull(surveyId: number): Promise<SurveyFull> {
    const { data } = await http.get<SurveyFull>(`/surveys/${surveyId}/full`);
    return data;
  },

  /** POST /surveys/:id/submit — mỗi khách hàng chỉ nộp 1 lần / khảo sát. */
  async submit(surveyId: number, payload: SubmitSurveyPayload): Promise<void> {
    await http.post(`/surveys/${surveyId}/submit`, payload);
  },
};
