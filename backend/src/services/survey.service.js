/**
 * Service cho Survey. Khảo sát có thể gắn (tùy chọn) với 1 sản phẩm qua productId.
 * KHÔNG có hard delete — dùng setActive() để đóng khảo sát.
 */
import prisma from '../config/database.js';
import {
  surveyRepository,
  surveyTargetRepository,
  customerRepository,
  productRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { QUESTION_TYPE_LIST, MIN_SURVEY_QUESTIONS, MESSAGES } from '../constants/index.js';

/** productId rỗng => khảo sát chung (null). Có giá trị => phải là sản phẩm tồn tại. */
async function resolveProductId(productId) {
  if (productId === undefined || productId === null || productId === '') return null;
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Sản phẩm không hợp lệ.');
  const product = await productRepository.findById(id);
  if (!product) throw new NotFoundError(MESSAGES.NOT_FOUND.PRODUCT);
  return id;
}

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

  /** Tạo khảo sát đơn giản (chung hoặc gắn sản phẩm), câu hỏi thêm sau. */
  async createSimple({ title, description, isActive = true, productId }) {
    if (!title?.trim()) throw new ValidationError('Tiêu đề khảo sát không được để trống.');
    const resolvedProductId = await resolveProductId(productId);
    return surveyRepository.create({
      title: title.trim(),
      description,
      isActive,
      productId: resolvedProductId,
    });
  },

  async createWithQuestions({ title, description, questions = [], productId }) {
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
    const resolvedProductId = await resolveProductId(productId);

    return prisma.survey.create({
      data: {
        title: title.trim(),
        description,
        isActive: true,
        productId: resolvedProductId,
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
      include: { product: true, questions: { include: { options: true } } },
    });
  },

  async update(surveyId, { title, description }) {
    await this.getById(surveyId);
    if (title !== undefined && !title.trim()) throw new ValidationError('Tiêu đề khảo sát không được để trống.');
    return surveyRepository.update(surveyId, { title: title?.trim(), description });
  },

  async setActive(surveyId, isActive) {
    await this.getById(surveyId);
    return surveyRepository.setActive(surveyId, isActive);
  },

  async assignToCustomers(surveyId, customerIds = []) {
    const survey = await this.getWithQuestions(surveyId);
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw new ValidationError('Danh sách khách hàng nhận khảo sát không được trống.');
    }

    const invalidQuestion = (survey.questions ?? []).find(
      (q) => q.questionType === 'SINGLE_CHOICE' && (!q.options || q.options.length < 2)
    );
    if (invalidQuestion) {
      throw new ValidationError(
        `Câu hỏi "${invalidQuestion.questionContent}" là dạng trắc nghiệm nhưng chưa có đủ lựa chọn (tối thiểu 2). Vui lòng bổ sung trước khi gửi khảo sát.`
      );
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
