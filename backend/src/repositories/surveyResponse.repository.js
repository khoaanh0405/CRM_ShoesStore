/**
 * Repository cho model SurveyResponse (bảng survey_responses).
 * survey_id -> surveys (RESTRICT), customer_id -> customers (RESTRICT).
 * UNIQUE(survey_id, customer_id): 1 khách hàng chỉ nộp 1 lần / khảo sát
 * (đúng yêu cầu đồ án). Trong schema.prisma, ràng buộc này được khai báo
 * TƯỜNG MINH: @@unique([surveyId, customerId], name: "uq_survey_response_customer")
 * => Prisma KHÔNG dùng tên mặc định `surveyId_customerId` nữa (tên mặc định
 * chỉ áp dụng khi không truyền `name`) mà dùng đúng tên đã đặt
 * `uq_survey_response_customer`. Trước đây where dùng nhầm
 * `surveyId_customerId` -> Prisma báo "Unknown argument `surveyId_customerId`".
 * survey_answers.response_id -> survey_responses (CASCADE): remove() 1
 * response sẽ tự động xóa toàn bộ answer con — an toàn, không bị FK chặn.
 */
import prisma from '../config/database.js';
export const surveyResponseRepository = {
  findAll() {
    return prisma.surveyResponse.findMany({ orderBy: { submittedAt: 'desc' } });
  },
  findById(responseId) {
    return prisma.surveyResponse.findUnique({ where: { responseId } });
  },
  findBySurvey(surveyId) {
    return prisma.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { submittedAt: 'desc' },
    });
  },
  findByCustomer(customerId) {
    return prisma.surveyResponse.findMany({
      where: { customerId },
      orderBy: { submittedAt: 'desc' },
    });
  },
  /** Kiểm tra khách hàng đã nộp khảo sát này chưa (đúng ràng buộc UNIQUE). */
  findBySurveyAndCustomer(surveyId, customerId) {
    return prisma.surveyResponse.findUnique({
      where: { uq_survey_response_customer: { surveyId, customerId } },
    });
  },
  /** Lấy kèm toàn bộ câu trả lời — phục vụ thống kê kết quả khảo sát (4.1.7). */
  findWithAnswers(responseId) {
    return prisma.surveyResponse.findUnique({
      where: { responseId },
      include: {
        surveyAnswers: { include: { surveyQuestion: true, option: true } },
      },
    });
  },
  /**
   * Khách hàng nộp khảo sát (mục 4.3.4). Việc kiểm tra khách hàng có nằm
   * trong survey_targets hay chưa nộp trước đó là nghiệp vụ của Service
   * layer (Repository chỉ insert, DB sẽ tự chặn nếu vi phạm UNIQUE).
   */
  create({ surveyId, customerId }) {
    return prisma.surveyResponse.create({
      data: { surveyId, customerId },
    });
  },
  remove(responseId) {
    return prisma.surveyResponse.delete({ where: { responseId } });
  },
};
export default surveyResponseRepository;
