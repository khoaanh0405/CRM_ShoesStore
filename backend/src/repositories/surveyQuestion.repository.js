/**
 * Repository cho model SurveyQuestion (bảng survey_questions).
 * survey_id -> surveys (CASCADE): xóa Survey sẽ tự cascade xóa câu hỏi.
 * survey_answers.question_id -> survey_questions (RESTRICT): remove() 1 câu
 * hỏi riêng lẻ sẽ throw lỗi FK (P2003) nếu đã có câu trả lời — Service layer
 * xử lý (thường không nên xóa câu hỏi đã có người trả lời, chỉ nên xóa khi
 * khảo sát chưa ai làm).
 * question_type là chuỗi tự do trong DB (không phải Prisma enum), theo seed
 * đang dùng 2 giá trị: 'SINGLE_CHOICE' và 'TEXT'. Repository không tự giới
 * hạn danh sách này vì đó là nghiệp vụ của Service layer.
 */
import prisma from '../config/database.js';

export const surveyQuestionRepository = {
  findAll() {
    return prisma.surveyQuestion.findMany({ orderBy: { questionId: 'asc' } });
  },

  findById(questionId) {
    return prisma.surveyQuestion.findUnique({
      where: { questionId },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
  },

  findBySurvey(surveyId) {
    return prisma.surveyQuestion.findMany({
      where: { surveyId },
      orderBy: { questionId: 'asc' },
    });
  },

  findBySurveyWithOptions(surveyId) {
    return prisma.surveyQuestion.findMany({
      where: { surveyId },
      orderBy: { questionId: 'asc' },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });
  },

  create({ surveyId, questionContent, questionType }) {
    return prisma.surveyQuestion.create({
      data: { surveyId, questionContent, questionType },
    });
  },

  update(questionId, { questionContent, questionType }) {
    return prisma.surveyQuestion.update({
      where: { questionId },
      data: { questionContent, questionType },
    });
  },

  remove(questionId) {
    return prisma.surveyQuestion.delete({ where: { questionId } });
  },
};

export default surveyQuestionRepository;
