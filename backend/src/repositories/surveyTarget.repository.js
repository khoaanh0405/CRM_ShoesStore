/**
 * Repository cho model SurveyTarget (bảng survey_targets).
 * PK composite (survey_id, customer_id) — đúng field tương ứng trong Prisma
 * là @@id([surveyId, customerId]), khi where phải dùng tên khóa hợp
 * (surveyId_customerId) mà Prisma tự sinh.
 * survey_id -> surveys (CASCADE), customer_id -> customers (CASCADE).
 * Đại diện cho việc "gửi khảo sát tới 1 khách hàng cụ thể" (mục 4.1.6).
 */
import prisma from '../config/database.js';

export const surveyTargetRepository = {
  findAll() {
    return prisma.surveyTarget.findMany();
  },

  findBySurveyAndCustomer(surveyId, customerId) {
    return prisma.surveyTarget.findUnique({
      where: { surveyId_customerId: { surveyId, customerId } },
    });
  },

  findBySurvey(surveyId) {
    return prisma.surveyTarget.findMany({
      where: { surveyId },
      include: { customer: true },
    });
  },

  findByCustomer(customerId) {
    return prisma.surveyTarget.findMany({
      where: { customerId },
      include: { survey: true },
    });
  },

  /** Gán 1 khách hàng vào danh sách nhận khảo sát. */
  create({ surveyId, customerId, isCompleted = false }) {
    return prisma.surveyTarget.create({
      data: { surveyId, customerId, isCompleted },
    });
  },

  /** Gán hàng loạt khách hàng cùng lúc cho 1 khảo sát. */
  createMany(targets) {
    return prisma.surveyTarget.createMany({ data: targets, skipDuplicates: true });
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
