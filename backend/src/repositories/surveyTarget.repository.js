/**
 * Repository cho model SurveyTarget (bảng survey_targets).
 * PK composite (survey_id, customer_id) -> where dùng surveyId_customerId.
 * sentSignature: "chữ ký" nội dung khảo sát tại thời điểm gửi, dùng để chặn gửi trùng.
 */
import prisma from '../config/database.js';

const PRODUCT_SELECT = {
  productId: true,
  productName: true,
  brand: true,
  imageUrl: true,
  price: true,
};

export const surveyTargetRepository = {
  findAll() {
    return prisma.surveyTarget.findMany();
  },

  findBySurveyAndCustomer(surveyId, customerId) {
    return prisma.surveyTarget.findUnique({
      where: { surveyId_customerId: { surveyId, customerId } },
    });
  },

  /** Lấy các target đã có của 1 nhóm khách hàng trong 1 khảo sát. */
  findBySurveyAndCustomers(surveyId, customerIds) {
    return prisma.surveyTarget.findMany({
      where: { surveyId, customerId: { in: customerIds } },
    });
  },

  findBySurvey(surveyId) {
    return prisma.surveyTarget.findMany({ where: { surveyId }, include: { customer: true } });
  },

  /** Kèm thông tin sản phẩm (nếu khảo sát gắn với sản phẩm) để customer hiển thị. */
  findByCustomer(customerId) {
    return prisma.surveyTarget.findMany({
      where: { customerId },
      include: { survey: { include: { product: { select: PRODUCT_SELECT } } } },
    });
  },

  create({ surveyId, customerId, isCompleted = false, sentSignature = null }) {
    return prisma.surveyTarget.create({ data: { surveyId, customerId, isCompleted, sentSignature } });
  },

  createMany(targets) {
    return prisma.surveyTarget.createMany({ data: targets, skipDuplicates: true });
  },

  /** Cập nhật chữ ký đã gửi cho nhiều khách hàng cùng lúc. */
  updateSignature(surveyId, customerIds, sentSignature) {
    return prisma.surveyTarget.updateMany({
      where: { surveyId, customerId: { in: customerIds } },
      data: { sentSignature },
    });
  },

  markCompleted(surveyId, customerId) {
    return prisma.surveyTarget.update({
      where: { surveyId_customerId: { surveyId, customerId } },
      data: { isCompleted: true },
    });
  },

  remove(surveyId, customerId) {
    return prisma.surveyTarget.delete({
      where: { surveyId_customerId: { surveyId, customerId } },
    });
  },
};

export default surveyTargetRepository;
