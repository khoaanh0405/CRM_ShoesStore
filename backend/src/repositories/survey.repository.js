/**
 * Repository cho model Survey (bảng surveys).
 * Không hard delete — dùng setActive() để đóng khảo sát (survey_responses RESTRICT).
 * Survey có thể gắn (tùy chọn) với 1 Product qua productId.
 */
import prisma from '../config/database.js';

const PRODUCT_SELECT = {
  productId: true,
  productName: true,
  brand: true,
  imageUrl: true,
  price: true,
};

export const surveyRepository = {
  findAll({ isActive } = {}) {
    return prisma.survey.findMany({
      where: typeof isActive === 'boolean' ? { isActive } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: PRODUCT_SELECT },
        _count: { select: { questions: true, surveyTargets: true, surveyResponses: true } },
      },
    });
  },

  findById(surveyId) {
    return prisma.survey.findUnique({
      where: { surveyId },
      include: { product: { select: PRODUCT_SELECT } },
    });
  },

  findByIdWithQuestions(surveyId) {
    return prisma.survey.findUnique({
      where: { surveyId },
      include: {
        product: { select: PRODUCT_SELECT },
        questions: { include: { options: { orderBy: { sortOrder: 'asc' } } } },
      },
    });
  },

  create({ title, description, isActive = true, productId = null }) {
    return prisma.survey.create({
      data: { title, description, isActive, productId },
      include: { product: { select: PRODUCT_SELECT } },
    });
  },

  update(surveyId, { title, description }) {
    return prisma.survey.update({ where: { surveyId }, data: { title, description } });
  },

  setActive(surveyId, isActive) {
    return prisma.survey.update({ where: { surveyId }, data: { isActive } });
  },
};

export default surveyRepository;
