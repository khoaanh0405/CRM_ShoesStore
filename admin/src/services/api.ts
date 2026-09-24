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
import type { Product, Supplier, CreateProductForm, CreateSupplierForm } from '../types/product';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Đính kèm token từ localStorage vào mọi request (tương thích với trang Login của team)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ====================================================
// DASHBOARD & ADMIN
// ====================================================

export const getDashboardStats = async () => {
  // Dùng thẳng endpoint /admin/stats (adminController.getDashboardStats) mà
  // backend đã tính sẵn, thay vì gộp 4 request riêng lẻ (getCustomers,
  // getProducts, getFeedbacks, getSurveys) — cách cũ dùng Promise.all nên chỉ
  // cần 1 trong 4 request lỗi/403 là toàn bộ dashboard mất số liệu.
  const res = await api.get('/admin/stats');
  return res.data?.data ?? res.data;
};

export const changePassword = async (accountId: number, data: any) => {
  const res = await api.patch(`/accounts/${accountId}/password`, data);
  return res.data?.data ?? res.data;
};

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

// ====================================================
// PRODUCTS & SUPPLIERS
// ====================================================

export const getProducts = async (params?: { includeInactive?: boolean }): Promise<Product[]> => {
  const res = await api.get('/products', { params: { includeInactive: true, ...params } });
  return res.data?.data ?? res.data ?? [];
};

export const createProduct = async (data: CreateProductForm): Promise<Product> => {
  const res = await api.post('/products', data);
  return res.data?.data ?? res.data;
};

export const updateProduct = async (productId: number, data: Partial<CreateProductForm>): Promise<Product> => {
  const res = await api.put(`/products/${productId}`, data);
  return res.data?.data ?? res.data;
};

export const toggleProductActive = async (productId: number, isActive: boolean): Promise<Product> => {
  const res = await api.patch(`/products/${productId}/active`, { isActive });
  return res.data?.data ?? res.data;
};

export const deleteProduct = async (productId: number): Promise<void> => {
  await api.delete(`/products/${productId}`);
};

export const getSuppliers = async (): Promise<Supplier[]> => {
  const res = await api.get('/suppliers');
  return res.data?.data ?? res.data ?? [];
};

export const createSupplier = async (data: CreateSupplierForm): Promise<Supplier> => {
  const res = await api.post('/suppliers', data);
  return res.data?.data ?? res.data;
};

export const updateSupplier = async (supplierId: number, data: Partial<CreateSupplierForm>): Promise<Supplier> => {
  const res = await api.put(`/suppliers/${supplierId}`, data);
  return res.data?.data ?? res.data;
};

export const deleteSupplier = async (supplierId: number): Promise<void> => {
  await api.delete(`/suppliers/${supplierId}`);
};

export const getAccounts = async () => {
  const res = await api.get('/accounts');
  return res.data?.data ?? res.data ?? [];
};

// GET /customers/report (customer.routes.js, staffOnly) — endpoint đã có
// sẵn ở backend (customerController.report), dùng cho panel "Báo cáo CRM"
// trên Dashboard.tsx.
export const getCustomerReport = async () => {
  const res = await api.get('/customers/report');
  return res.data?.data ?? res.data;
};

// Backend chưa có endpoint activity log — trả mảng rỗng cho tới khi có API thật
export const getRecentActivity = async (): Promise<{ time: string; account: string; action: string }[]> => {
  try {
    const res = await api.get('/admin/activity-log');
    return res.data?.data ?? res.data ?? [];
  } catch {
    return [];
  }
};

// Backend chưa có tracking online — trả null cho tới khi làm Socket.io/polling
export const getOnlineCustomerCount = async (): Promise<number | null> => {
  try {
    const res = await api.get('/admin/online-count');
    return res.data?.count ?? null;
  } catch {
    return null;
  }
};

export default api;