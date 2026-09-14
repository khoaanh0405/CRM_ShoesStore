/**
 * Repository cho model SurveyAnswer (bảng survey_answers).
 * response_id -> survey_responses (CASCADE)
 * question_id -> survey_questions (RESTRICT)
 * option_id   -> survey_question_options (SET NULL, nullable)
 *
 * Quy ước dữ liệu theo đúng seed.js: câu TEXT chỉ có answerValue (optionId
 * = null); câu SINGLE_CHOICE lưu cả answerValue (text lựa chọn, denormalized)
 * lẫn optionId (để group-by chính xác khi thống kê).
 */
import prisma from '../config/database.js';

export const surveyAnswerRepository = {
  findAll() {
    return prisma.surveyAnswer.findMany({ orderBy: { answerId: 'asc' } });
  },

  findById(answerId) {
    return prisma.surveyAnswer.findUnique({ where: { answerId } });
  },

  findByResponse(responseId) {
    return prisma.surveyAnswer.findMany({
      where: { responseId },
      orderBy: { questionId: 'asc' },
    });
  },

  findByQuestion(questionId) {
    return prisma.surveyAnswer.findMany({
      where: { questionId },
      orderBy: { answerId: 'asc' },
    });
  },

  create({ responseId, questionId, answerValue, optionId = null }) {
    return prisma.surveyAnswer.create({
      data: { responseId, questionId, answerValue, optionId },
    });
  },

  /** Lưu nhiều câu trả lời cùng lúc khi khách hàng nộp 1 response. */
  createMany(answers) {
    return prisma.surveyAnswer.createMany({ data: answers });
  },

  remove(answerId) {
    return prisma.surveyAnswer.delete({ where: { answerId } });
  },

  /**
   * Thống kê kết quả khảo sát cho câu SINGLE_CHOICE/MULTIPLE_CHOICE
   * (mục 4.1.7 "Thống kê kết quả khảo sát") — đếm số lượt chọn theo optionId.
   * Với câu TEXT, optionId luôn null nên groupBy này sẽ gộp tất cả vào 1 nhóm
   * null; Service layer nên tự lấy findByQuestion() để hiển thị câu TEXT.
   */
  countByQuestionOption(questionId) {
    return prisma.surveyAnswer.groupBy({
      by: ['optionId'],
      where: { questionId },
      _count: { _all: true },
    });
  },
};

export default surveyAnswerRepository;
