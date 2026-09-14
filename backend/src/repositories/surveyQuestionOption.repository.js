/**
 * Repository cho model SurveyQuestionOption (bảng survey_question_options).
 * question_id -> survey_questions (CASCADE).
 * survey_answers.option_id -> survey_question_options (SET NULL): xóa 1 lựa
 * chọn không bị FK chặn (answer cũ chỉ mất liên kết optionId, answerValue
 * dạng text vẫn giữ nguyên) — remove() luôn an toàn.
 * Chỉ áp dụng cho câu hỏi SINGLE_CHOICE / MULTIPLE_CHOICE (câu TEXT không có option).
 */
import prisma from '../config/database.js';

export const surveyQuestionOptionRepository = {
  findAll() {
    return prisma.surveyQuestionOption.findMany({ orderBy: { optionId: 'asc' } });
  },

  findById(optionId) {
    return prisma.surveyQuestionOption.findUnique({ where: { optionId } });
  },

  findByQuestion(questionId) {
    return prisma.surveyQuestionOption.findMany({
      where: { questionId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  create({ questionId, optionText, sortOrder = 0 }) {
    return prisma.surveyQuestionOption.create({
      data: { questionId, optionText, sortOrder },
    });
  },

  update(optionId, { optionText, sortOrder }) {
    return prisma.surveyQuestionOption.update({
      where: { optionId },
      data: { optionText, sortOrder },
    });
  },

  remove(optionId) {
    return prisma.surveyQuestionOption.delete({ where: { optionId } });
  },
};

export default surveyQuestionOptionRepository;
