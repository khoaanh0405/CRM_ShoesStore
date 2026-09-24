import type { SubmitSurveyPayload, SurveyFull, SurveyTarget } from '@/types/survey';
import { http } from './http';

export const surveyService = {
  async listByCustomer(customerId: number): Promise<SurveyTarget[]> {
    const { data } = await http.get<SurveyTarget[]>(`/customers/${customerId}/surveys`);
    return data;
  },
  async getFull(surveyId: number): Promise<SurveyFull> {
    const { data } = await http.get<SurveyFull>(`/surveys/${surveyId}/full`);
    return data;
  },
  async submit(surveyId: number, payload: SubmitSurveyPayload): Promise<void> {
    await http.post(`/surveys/${surveyId}/submit`, payload);
  },
};
