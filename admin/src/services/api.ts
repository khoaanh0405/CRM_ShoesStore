import axios from 'axios';
import type { Feedback, FeedbackStatus } from '../types/feedback';
import type {
  Survey,
  SurveyStats,
  SurveyTarget,
  SurveyResponse,
  CreateSurveyForm,
  CreateQuestionForm,
  CreateOptionForm,
} from '../types/survey';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Đính kèm token từ localStorage vào mọi request (tương thích với trang Login của team)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ====================================================
// FEEDBACKS
// ====================================================

export const getFeedbacks = async (params?: { status?: FeedbackStatus; productId?: number }): Promise<Feedback[]> => {
  const res = await api.get('/feedbacks', { params });
  return res.data?.data ?? res.data ?? [];
};

export const updateFeedbackStatus = async (
  feedbackId: number,
  status: FeedbackStatus
): Promise<Feedback> => {
  const res = await api.patch(`/feedbacks/${feedbackId}/status`, { status });
  return res.data?.data ?? res.data;
};

// ====================================================
// SURVEYS
// ====================================================

export const getSurveys = async (): Promise<Survey[]> => {
  const res = await api.get('/surveys');
  return res.data?.data ?? res.data ?? [];
};

export const createSurvey = async (data: CreateSurveyForm): Promise<Survey> => {
  const res = await api.post('/surveys/simple', data);
  return res.data?.data ?? res.data;
};

export const toggleSurveyActive = async (surveyId: number, isActive: boolean): Promise<Survey> => {
  const res = await api.patch(`/surveys/${surveyId}/active`, { isActive });
  return res.data?.data ?? res.data;
};

export const getSurveyFull = async (surveyId: number): Promise<Survey> => {
  const res = await api.get(`/surveys/${surveyId}/full`);
  return res.data?.data ?? res.data;
};

export const getSurveyStats = async (surveyId: number): Promise<SurveyStats> => {
  const res = await api.get(`/surveys/${surveyId}/stats`);
  return res.data?.data ?? res.data;
};

export const assignSurvey = async (surveyId: number, customerIds: number[]): Promise<void> => {
  await api.post(`/surveys/${surveyId}/assign`, { customerIds });
};

// ====================================================
// SURVEY TARGETS (Đối tượng được gán)
// ====================================================

export const getSurveyTargets = async (surveyId: number): Promise<SurveyTarget[]> => {
  const res = await api.get('/customers', { params: { surveyId } });
  // Fallback: lấy từ survey full rồi extract targets
  return res.data?.data ?? res.data ?? [];
};

export const getSurveyResponses = async (surveyId: number): Promise<SurveyResponse[]> => {
  const res = await api.get('/responses', { params: { surveyId } });
  return res.data?.data ?? res.data ?? [];
};

// ====================================================
// SURVEY QUESTIONS
// ====================================================

export const createQuestion = async (data: CreateQuestionForm) => {
  const res = await api.post('/questions', data);
  return res.data?.data ?? res.data;
};

export const updateQuestion = async (questionId: number, data: Partial<CreateQuestionForm>) => {
  const res = await api.put(`/questions/${questionId}`, data);
  return res.data?.data ?? res.data;
};

export const deleteQuestion = async (questionId: number): Promise<void> => {
  await api.delete(`/questions/${questionId}`);
};

// ====================================================
// SURVEY QUESTION OPTIONS
// ====================================================

export const createOption = async (data: CreateOptionForm) => {
  const res = await api.post('/options', data);
  return res.data?.data ?? res.data;
};

export const deleteOption = async (optionId: number): Promise<void> => {
  await api.delete(`/options/${optionId}`);
};

// ====================================================
// CUSTOMERS (dùng khi gán survey)
// ====================================================

export interface CustomerBasic {
  customerId: number;
  fullName: string;
  phone?: string | null;
  account?: { username: string; isLocked: boolean };
}

export const getCustomers = async (): Promise<CustomerBasic[]> => {
  const res = await api.get('/customers');
  return res.data?.data ?? res.data ?? [];
};

export default api;
