/**
 * Service cho SurveyResponse — nghiệp vụ quan trọng nhất: khách hàng nộp
 * khảo sát (mục 4.3.4). submit() phải chạy trong 1 prisma.$transaction để
 * tránh trạng thái nửa vời: có SurveyResponse nhưng thiếu SurveyAnswer, hoặc
 * SurveyTarget không được đánh dấu isCompleted.
 */
import prisma from '../config/database.js';
import {
  surveyResponseRepository,
  surveyRepository,
  surveyQuestionRepository,
  surveyTargetRepository,
  customerRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from '../errors/AppError.js';
import { MESSAGES } from '../constants/index.js';

export const surveyResponseService = {
  async getById(responseId) {
    const response = await surveyResponseRepository.findById(responseId);
    if (!response) throw new NotFoundError(MESSAGES.NOT_FOUND.RESPONSE);
    return response;
  },

  listBySurvey(surveyId) {
    return surveyResponseRepository.findBySurvey(surveyId);
  },

  listByCustomer(customerId) {
    return surveyResponseRepository.findByCustomer(customerId);
  },

  async getWithAnswers(responseId) {
    const response = await surveyResponseRepository.findWithAnswers(responseId);
    if (!response) throw new NotFoundError(MESSAGES.NOT_FOUND.RESPONSE);
    return response;
  },

  /**
   * Khách hàng nộp khảo sát. Điều kiện:
   * - Khảo sát đang mở (isActive = true).
   * - customerId nằm trong survey_targets của khảo sát này (đã được Admin gửi).
   * - Chưa từng nộp khảo sát này (UNIQUE survey_id + customer_id).
   * - answers: mảng { questionId, answerValue, optionId? }, phải trả lời đủ
   *   và đúng toàn bộ câu hỏi thuộc khảo sát.
   */
  async submit({ surveyId, customerId, answers = [] }) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);
    if (!survey.isActive) throw new ValidationError('Khảo sát này đã đóng, không nhận thêm phản hồi.');

    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);

    const target = await surveyTargetRepository.findBySurveyAndCustomer(surveyId, customerId);
    if (!target) throw new ForbiddenError(MESSAGES.SURVEY.NOT_TARGETED);
    if (target.isCompleted) throw new ConflictError(MESSAGES.SURVEY.ALREADY_SUBMITTED);

    const existedResponse = await surveyResponseRepository.findBySurveyAndCustomer(surveyId, customerId);
    if (existedResponse) throw new ConflictError(MESSAGES.SURVEY.ALREADY_SUBMITTED);

    const questions = await surveyQuestionRepository.findBySurvey(surveyId);
    const questionIds = new Set(questions.map((q) => q.questionId));

    if (!Array.isArray(answers) || answers.length !== questions.length) {
      throw new ValidationError('Vui lòng trả lời đầy đủ tất cả các câu hỏi trong khảo sát.');
    }
    for (const answer of answers) {
      if (!questionIds.has(answer.questionId)) {
        throw new ValidationError(`Câu hỏi #${answer.questionId} không thuộc khảo sát này.`);
      }
      if (!answer.answerValue?.toString().trim()) {
        throw new ValidationError('Câu trả lời không được để trống.');
      }
    }

    return prisma.$transaction(async (tx) => {
      const response = await tx.surveyResponse.create({ data: { surveyId, customerId } });

      await tx.surveyAnswer.createMany({
        data: answers.map((answer) => ({
          responseId: response.responseId,
          questionId: answer.questionId,
          answerValue: answer.answerValue.toString().trim(),
          optionId: answer.optionId ?? null,
        })),
      });

      await tx.surveyTarget.update({
        where: { surveyId_customerId: { surveyId, customerId } },
        data: { isCompleted: true },
      });

      return tx.surveyResponse.findUnique({
        where: { responseId: response.responseId },
        include: { surveyAnswers: true },
      });
    });
  },

  async remove(responseId) {
    await this.getById(responseId);
    return surveyResponseRepository.remove(responseId);
  },
};

export default surveyResponseService;
