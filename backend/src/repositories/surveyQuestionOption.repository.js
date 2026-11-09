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
