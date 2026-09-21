/**
 * Repository cho model Survey (bảng surveys).
 *
 * survey_questions.survey_id -> surveys (CASCADE)
 * survey_targets.survey_id   -> surveys (CASCADE)
 * survey_responses.survey_id -> surveys (RESTRICT)
 *
 * => Đây là quan hệ cascade KHÔNG đồng nhất: nếu hard-delete 1 Survey đã có
 * SurveyResponse, thao tác sẽ luôn thất bại vì RESTRICT ở survey_responses,
 * bất kể survey_questions/survey_targets có cascade được hay không (migration
 * xác nhận đúng thiết kế này, không phải lỗi). Theo quyết định đã thống nhất,
 * Repository này KHÔNG triển khai hard delete cho Survey. Thay vào đó dùng
 * setActive() (toggle surveys.is_active) — đúng với seed.js đã có sẵn ví dụ
 * survey3.isActive = false để minh họa "khảo sát đã đóng, không nhận thêm
 * phản hồi" mà vẫn giữ nguyên dữ liệu lịch sử để thống kê.
 */
import prisma from '../config/database.js';

export const surveyRepository = {
  findAll({ isActive } = {}) {
    return prisma.survey.findMany({
      where: typeof isActive === 'boolean' ? { isActive } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            questions: true,
            surveyTargets: true,
            surveyResponses: true,
          },
        },
      },
    });
  },

  findById(surveyId) {
    return prisma.survey.findUnique({ where: { surveyId } });
  },

  /** Lấy đầy đủ câu hỏi + lựa chọn để hiển thị khảo sát cho khách hàng làm. */
  findByIdWithQuestions(surveyId) {
    return prisma.survey.findUnique({
      where: { surveyId },
      include: {
        questions: {
          include: { options: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
  },

  /** Admin "Tạo bảng khảo sát và gửi đến tài khoản khách hàng" (mục 4.1.6). */
  create({ title, description, isActive = true }) {
    return prisma.survey.create({
      data: { title, description, isActive },
    });
  },

  update(surveyId, { title, description }) {
    return prisma.survey.update({
      where: { surveyId },
      data: { title, description },
    });
  },

  /** Đóng/mở khảo sát — thay thế an toàn cho hard delete (xem ghi chú đầu file). */
  setActive(surveyId, isActive) {
    return prisma.survey.update({
      where: { surveyId },
      data: { isActive },
    });
  },
};

export default surveyRepository;
