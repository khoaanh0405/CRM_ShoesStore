/**
 * Service cho Survey. Khảo sát có thể gắn (tùy chọn) với 1 sản phẩm qua productId.
 * KHÔNG có hard delete — dùng setActive() để đóng khảo sát.
 *
 * assignToCustomers(): gửi khảo sát + tạo thông báo cho khách hàng + chặn gửi
 * trùng (nội dung khảo sát chưa đổi thì không gửi lại cho người đã nhận).
 */
import { createHash } from 'node:crypto';
import prisma from '../config/database.js';
import {
  surveyRepository,
  surveyTargetRepository,
  customerRepository,
  productRepository,
} from '../repositories/index.js';
import { notificationService } from './notification.service.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { QUESTION_TYPE_LIST, MIN_SURVEY_QUESTIONS, MESSAGES } from '../constants/index.js';
import { NOTIFICATION_TYPE, NOTIFICATION_REF_TYPE } from '../constants/notification.constant.js';

/** productId rỗng => khảo sát chung (null). Có giá trị => phải là sản phẩm tồn tại. */
async function resolveProductId(productId) {
  if (productId === undefined || productId === null || productId === '') return null;
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Sản phẩm không hợp lệ.');
  const product = await productRepository.findById(id);
  if (!product) throw new NotFoundError(MESSAGES.NOT_FOUND.PRODUCT);
  return id;
}

/** Chữ ký nội dung khảo sát: đổi tiêu đề/mô tả/câu hỏi/lựa chọn thì chữ ký đổi. */
function surveySignature(survey) {
  const questions = [...(survey.questions ?? [])]
    .sort((a, b) => a.questionId - b.questionId)
    .map((q) => [
      q.questionId,
      q.questionContent,
      q.questionType,
      [...(q.options ?? [])]
        .sort((a, b) => a.optionId - b.optionId)
        .map((o) => [o.optionId, o.optionText]),
    ]);
  const raw = JSON.stringify({ t: survey.title, d: survey.description ?? '', q: questions });
  return createHash('sha1').update(raw).digest('hex');
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

    /** Tạo khảo sát đơn giản (chung hoặc gắn sản phẩm), câu hỏi thêm sau. createdBy = Manager tạo. */
  async createSimple({ title, description, isActive = true, productId, createdBy }) {
    if (!title?.trim()) throw new ValidationError('Tiêu đề khảo sát không được để trống.');
    const resolvedProductId = await resolveProductId(productId);
    return surveyRepository.create({
      title: title.trim(),
      description,
      isActive,
      productId: resolvedProductId,
      createdBy: createdBy ?? null,
    });
  },

  async createWithQuestions({ title, description, questions = [], productId, createdBy }) {
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
        createdBy: createdBy ?? null,
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
      include: { product: true, creator: { select: { accountId: true, username: true, email: true } }, questions: { include: { options: true } } },
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

  /**
   * Gửi khảo sát cho khách hàng.
   * - Chưa nhận bao giờ            -> tạo target + gửi thông báo "khảo sát mới".
   * - Đã nhận, nội dung đã đổi     -> cập nhật chữ ký + thông báo "khảo sát được cập nhật"
   *                                   (nếu chưa làm xong).
   * - Đã nhận, nội dung KHÔNG đổi  -> bỏ qua (chặn gửi trùng).
   * Nếu không còn ai cần gửi -> 409 với thông báo rõ ràng.
   */
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
    const ids = [...new Set(customerIds)].filter((id) => validIds.has(id));
    if (ids.length === 0) {
      throw new ValidationError('Không có khách hàng hợp lệ nào để gán khảo sát.');
    }

    const signature = surveySignature(survey);
    const existing = await surveyTargetRepository.findBySurveyAndCustomers(surveyId, ids);
    const existingMap = new Map(existing.map((t) => [t.customerId, t]));

    const toCreate = [];
    const toUpdate = [];
    const toBackfill = []; // cập nhật chữ ký âm thầm, không thông báo

    for (const id of ids) {
      const t = existingMap.get(id);
      if (!t) toCreate.push(id);
      else if (t.sentSignature === signature) continue;
      else if (t.sentSignature === null || t.isCompleted) toBackfill.push(id);
      else toUpdate.push(id);
    }

    if (toBackfill.length) {
      await surveyTargetRepository.updateSignature(surveyId, toBackfill, signature);
    }

    if (toCreate.length === 0 && toUpdate.length === 0) {
      throw new ConflictError(
        'Khảo sát chưa có thay đổi mới và đã được gửi cho những khách hàng này rồi.'
      );
    }

    if (toCreate.length) {
      await surveyTargetRepository.createMany(
        toCreate.map((customerId) => ({ surveyId, customerId, sentSignature: signature }))
      );
      await notificationService.createMany(
        toCreate.map((customerId) => ({
          customerId,
          type: NOTIFICATION_TYPE.SURVEY_ASSIGNED,
          title: 'Bạn có khảo sát mới',
          message: `Bạn vừa nhận được khảo sát "${survey.title}". Hãy hoàn thành để giúp chúng tôi cải thiện dịch vụ.`,
          refType: NOTIFICATION_REF_TYPE.SURVEY,
          refId: surveyId,
        }))
      );
    }

    if (toUpdate.length) {
      await surveyTargetRepository.updateSignature(surveyId, toUpdate, signature);
      await notificationService.createMany(
        toUpdate.map((customerId) => ({
          customerId,
          type: NOTIFICATION_TYPE.SURVEY_ASSIGNED,
          title: 'Khảo sát đã được cập nhật',
          message: `Khảo sát "${survey.title}" vừa được cập nhật nội dung. Hãy xem lại và hoàn thành nhé.`,
          refType: NOTIFICATION_REF_TYPE.SURVEY,
          refId: surveyId,
        }))
      );
    }

    return {
      sent: toCreate.length,
      updated: toUpdate.length,
      skipped: ids.length - toCreate.length - toUpdate.length,
    };
  },
};

export default surveyService;
