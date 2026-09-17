import { surveyTargetRepository, surveyRepository, customerRepository } from '../repositories/index.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';
import { MESSAGES } from '../constants/index.js';

export const surveyTargetService = {
  listBySurvey(surveyId) {
    return surveyTargetRepository.findBySurvey(surveyId);
  },

  /** Danh sách khảo sát mà 1 khách hàng nhận được — dùng cho trang "khảo sát của tôi" (mục 4.3.4). */
  listByCustomer(customerId) {
    return surveyTargetRepository.findByCustomer(customerId);
  },

  /** Gán 1 khách hàng vào danh sách nhận khảo sát (mục 4.1.6). */
  async assign(surveyId, customerId) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);

    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);

    const existed = await surveyTargetRepository.findBySurveyAndCustomer(surveyId, customerId);
    if (existed) throw new ConflictError(MESSAGES.SURVEY.ALREADY_TARGETED);

    return surveyTargetRepository.create({ surveyId, customerId });
  },

  /** Gán hàng loạt — dùng chung logic với surveyService.assignToCustomers(). */
  async assignMany(surveyId, customerIds = []) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);

    const targets = [...new Set(customerIds)].map((customerId) => ({ surveyId, customerId }));
    return surveyTargetRepository.createMany(targets);
  },

  async remove(surveyId, customerId) {
    const existed = await surveyTargetRepository.findBySurveyAndCustomer(surveyId, customerId);
    if (!existed) throw new NotFoundError(MESSAGES.SURVEY.NOT_TARGETED);
    return surveyTargetRepository.remove(surveyId, customerId);
  },
};

export default surveyTargetService;
