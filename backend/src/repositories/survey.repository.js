/**
 * Repository cho Survey. Có createdBy (Manager tạo khảo sát) -> include `creator`.
 */
import prisma from '../config/database.js';

const PRODUCT_SELECT = { productId: true, productName: true, brand: true, imageUrl: true, price: true };
const CREATOR_SELECT = { accountId: true, username: true, email: true };

export const surveyRepository = {
  findAll({ isActive } = {}) {
    return prisma.survey.findMany({
      where: typeof isActive === 'boolean' ? { isActive } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: PRODUCT_SELECT },
        creator: { select: CREATOR_SELECT },
        _count: { select: { questions: true, surveyTargets: true, surveyResponses: true } },
      },
    });
  },

  findById(surveyId) {
    return prisma.survey.findUnique({
      where: { surveyId },
      include: { product: { select: PRODUCT_SELECT }, creator: { select: CREATOR_SELECT } },
    });
  },

  findByIdWithQuestions(surveyId) {
    return prisma.survey.findUnique({
      where: { surveyId },
      include: {
        product: { select: PRODUCT_SELECT },
        creator: { select: CREATOR_SELECT },
        questions: {
          orderBy: { questionId: 'asc' },
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
        _count: { select: { surveyTargets: true, surveyResponses: true } },
      },
    });
  },

  create({ title, description, isActive = true, productId = null, createdBy = null }) {
    return prisma.survey.create({
      data: { title, description, isActive, productId, createdBy },
      include: { product: { select: PRODUCT_SELECT }, creator: { select: CREATOR_SELECT } },
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