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
