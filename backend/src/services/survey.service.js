/**
 * Service cho Survey. createWithQuestions() dùng prisma.$transaction /
 * nested-write trực tiếp (không qua Repository) để tạo Survey + câu hỏi +
 * lựa chọn nguyên tử trong 1 lần — vì Repository layer chỉ expose CRUD đơn
 * giản cho từng bảng riêng lẻ.
 *
 * Theo đúng thiết kế trong survey.repository.js: KHÔNG có hard delete cho
 * Survey (survey_responses RESTRICT sẽ luôn chặn nếu đã có người trả lời) —
 * Service dùng setActive() để "đóng" khảo sát thay vì xóa.
 */
import prisma from '../config/database.js';
import { surveyRepository, surveyTargetRepository, customerRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { QUESTION_TYPE_LIST, MIN_SURVEY_QUESTIONS, MESSAGES } from '../constants/index.js';

export const surveyService = {
  list({ isActive } = {}) {
    return surveyRepository.findAll({ isActive });
  },

  async getById(surveyId) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);
    return survey;
  },

  async getWithQuestions(surveyId) {
    const survey = await surveyRepository.findByIdWithQuestions(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);
    return survey;
  },

  /**
   * Tạo khảo sát đơn giản (không cần câu hỏi ngay). Admin sẽ thêm câu hỏi
   * sau qua Tab "Câu hỏi & Tùy chọn" trong trang chi tiết.
   */
  async createSimple({ title, description, isActive = true }) {
    if (!title?.trim()) throw new ValidationError('Tiêu đề khảo sát không được để trống.');
    return surveyRepository.create({ title: title.trim(), description, isActive });
  },

  /**
   * Admin "Tạo bảng khảo sát và gửi đến tài khoản khách hàng" (mục 4.1.6),
   * phần tạo khảo sát. questions: [{ questionContent, questionType, options? }]
   * — options bắt buộc (>=2) khi questionType = 'SINGLE_CHOICE'.
   */
  async createWithQuestions({ title, description, questions = [] }) {
    if (!title?.trim()) throw new ValidationError('Tiêu đề khảo sát không được để trống.');
    if (!Array.isArray(questions) || questions.length < MIN_SURVEY_QUESTIONS) {
      throw new ValidationError(`Khảo sát phải có ít nhất ${MIN_SURVEY_QUESTIONS} câu hỏi.`);
    }
    for (const q of questions) {
      if (!q.questionContent?.trim()) throw new ValidationError('Nội dung câu hỏi không được để trống.');
      if (!QUESTION_TYPE_LIST.includes(q.questionType)) {
        throw new ValidationError(`Loại câu hỏi không hợp lệ: "${q.questionType}".`);
      }
      if (q.questionType === 'SINGLE_CHOICE' && (!Array.isArray(q.options) || q.options.length < 2)) {
        throw new ValidationError('Câu hỏi trắc nghiệm (SINGLE_CHOICE) phải có ít nhất 2 lựa chọn.');
      }
    }

    return prisma.survey.create({
      data: {
        title: title.trim(),
        description,
        isActive: true,
        questions: {
          create: questions.map((q) => ({
            questionContent: q.questionContent.trim(),
            questionType: q.questionType,
            ...(q.questionType === 'SINGLE_CHOICE' && {
              options: {
                create: q.options.map((optionText, idx) => ({
                  optionText: optionText.trim(),
                  sortOrder: idx,
                })),
              },
            }),
          })),
        },
      },
      include: { questions: { include: { options: true } } },
    });
  },

  async update(surveyId, { title, description }) {
    await this.getById(surveyId);
    if (title !== undefined && !title.trim()) throw new ValidationError('Tiêu đề khảo sát không được để trống.');
    return surveyRepository.update(surveyId, { title: title?.trim(), description });
  },

  /** Đóng/mở khảo sát — thay thế an toàn cho hard delete. */
  async setActive(surveyId, isActive) {
    await this.getById(surveyId);
    return surveyRepository.setActive(surveyId, isActive);
  },

  /**
   * Gửi khảo sát tới danh sách khách hàng (mục 4.1.6). Bỏ qua các customerId
   * không tồn tại/đã bị soft-delete; skipDuplicates để chạy lại an toàn nếu
   * một vài khách hàng đã được gán từ trước.
   */
  async assignToCustomers(surveyId, customerIds = []) {
    await this.getById(surveyId);
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw new ValidationError('Danh sách khách hàng nhận khảo sát không được trống.');
    }

    const activeCustomers = await customerRepository.findAll();
    const validIds = new Set(activeCustomers.map((c) => c.customerId));
    const targets = [...new Set(customerIds)]
      .filter((id) => validIds.has(id))
      .map((customerId) => ({ surveyId, customerId }));

    if (targets.length === 0) {
      throw new ValidationError('Không có khách hàng hợp lệ nào để gán khảo sát.');
    }

    return surveyTargetRepository.createMany(targets);
  },
};

export default surveyService;
