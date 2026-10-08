import api from '../utils/api';
import type { Product, Supplier, CreateProductForm, CreateSupplierForm } from '../types/product';
import type { Feedback, FeedbackStatus } from '../types/feedback';
import type { Survey, SurveyStats, QuestionType } from '../types/survey';

/**
 * Lớp gọi API cho web quản trị. Axios instance (token, xử lý 401) nằm ở ../utils/api.
 * Backend trả dữ liệu trực tiếp; unwrap() chấp nhận cả dạng { data: ... } cho chắc.
 */
const unwrap = <T = any>(res: { data: any }): T => (res.data?.data ?? res.data) as T;

export interface CustomerBasic {
  customerId: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  isLocked?: boolean;
  preferences?: { tag: string }[];
}

/* ================= Tài khoản ================= */
export const getAccounts = async (): Promise<any[]> => unwrap(await api.get('/accounts'));

export const changePassword = async (
  accountId: number,
  payload: { oldPassword: string; newPassword: string },
) => unwrap(await api.patch(`/accounts/${accountId}/password`, payload));

/* ================= Sản phẩm ================= */
// Mặc định lấy cả sản phẩm đã ẩn (trang quản lý cần để bật lại); truyền includeInactive:false để chỉ lấy đang bán.
export const getProducts = async (params: { includeInactive?: boolean } = {}): Promise<Product[]> =>
  unwrap(await api.get('/products', { params: { includeInactive: true, ...params } }));

export const createProduct = async (payload: CreateProductForm): Promise<Product> =>
  unwrap(await api.post('/products', payload));

export const updateProduct = async (productId: number, payload: CreateProductForm): Promise<Product> =>
  unwrap(await api.put(`/products/${productId}`, payload));

export const toggleProductActive = async (productId: number, isActive: boolean): Promise<Product> =>
  unwrap(await api.patch(`/products/${productId}/active`, { isActive }));

/* ================= Nhà cung cấp ================= */
export const getSuppliers = async (): Promise<Supplier[]> => unwrap(await api.get('/suppliers'));

export const createSupplier = async (payload: CreateSupplierForm): Promise<Supplier> =>
  unwrap(await api.post('/suppliers', payload));

export const updateSupplier = async (supplierId: number, payload: CreateSupplierForm): Promise<Supplier> =>
  unwrap(await api.put(`/suppliers/${supplierId}`, payload));

export const deleteSupplier = async (supplierId: number): Promise<void> => {
  await api.delete(`/suppliers/${supplierId}`);
};

/* ================= Khách hàng ================= */
export const getCustomers = async (): Promise<CustomerBasic[]> => unwrap(await api.get('/customers'));

export const getCustomerReport = async (): Promise<any> => unwrap(await api.get('/customers/report'));

/** Số khách đang online (GET /admin/online-count -> { count }). */
export const getOnlineCustomerCount = async (): Promise<number> => {
  const res = await api.get('/admin/online-count');
  return Number(res.data?.count ?? res.data?.data?.count ?? 0);
};

/* ================= Đánh giá ================= */
export const getFeedbacks = async (): Promise<Feedback[]> => unwrap(await api.get('/feedbacks'));

export const updateFeedbackStatus = async (feedbackId: number, status: FeedbackStatus): Promise<Feedback> =>
  unwrap(await api.patch(`/feedbacks/${feedbackId}/status`, { status }));

/* ================= Khảo sát ================= */
export const getSurveys = async (): Promise<any[]> => unwrap(await api.get('/surveys'));

export const getSurveyFull = async (surveyId: number): Promise<Survey> =>
  unwrap(await api.get(`/surveys/${surveyId}/full`));

export const getSurveyStats = async (surveyId: number): Promise<SurveyStats> =>
  unwrap(await api.get(`/surveys/${surveyId}/stats`));

export const toggleSurveyActive = async (surveyId: number, isActive: boolean): Promise<Survey> =>
  unwrap(await api.patch(`/surveys/${surveyId}/active`, { isActive }));

export const assignSurvey = async (surveyId: number, customerIds: number[]) =>
  unwrap(await api.post(`/surveys/${surveyId}/assign`, { customerIds }));

/* ----- Câu hỏi & lựa chọn ----- */
export const createQuestion = async (payload: {
  surveyId: number;
  questionContent: string;
  questionType: QuestionType;
}) => unwrap(await api.post('/questions', payload));

export const updateQuestion = async (questionId: number, payload: { questionContent: string }) =>
  unwrap(await api.put(`/questions/${questionId}`, payload));

export const deleteQuestion = async (questionId: number): Promise<void> => {
  await api.delete(`/questions/${questionId}`);
};

export const createOption = async (payload: { questionId: number; optionText: string }) =>
  unwrap(await api.post('/options', payload));

export const deleteOption = async (optionId: number): Promise<void> => {
  await api.delete(`/options/${optionId}`);
};

export default api;
