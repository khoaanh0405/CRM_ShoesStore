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
