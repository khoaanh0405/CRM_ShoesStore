import { surveyTargetRepository, surveyRepository, customerRepository } from '../repositories/index.js';
import { notificationService } from './notification.service.js';
import { NotFoundError, ConflictError } from '../errors/AppError.js';
import { MESSAGES } from '../constants/index.js';
import { NOTIFICATION_TYPE, NOTIFICATION_REF_TYPE } from '../constants/notification.constant.js';
export const surveyTargetService = {
  listBySurvey(surveyId) {
    return surveyTargetRepository.findBySurvey(surveyId);
  },
  /** Danh sách khảo sát mà 1 khách hàng nhận được — dùng cho trang "khảo sát của tôi" (mục 4.3.4). */
  listByCustomer(customerId) {
    return surveyTargetRepository.findByCustomer(customerId);
  },
  /**
   * Gán 1 khách hàng vào danh sách nhận khảo sát (mục 4.1.6). Đồng thời tạo
   * Notification để khách hàng biết có khảo sát mới (chuông thông báo).
   */
  async assign(surveyId, customerId) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    const existed = await surveyTargetRepository.findBySurveyAndCustomer(surveyId, customerId);
    if (existed) throw new ConflictError(MESSAGES.SURVEY.ALREADY_TARGETED);
    const target = await surveyTargetRepository.create({ surveyId, customerId });
    await notificationService.create({
      customerId,
      type: NOTIFICATION_TYPE.SURVEY_ASSIGNED,
      title: 'Bạn có khảo sát mới',
      message: `Bạn vừa nhận được khảo sát "${survey.title}". Hãy hoàn thành để giúp chúng tôi cải thiện dịch vụ.`,
      refType: NOTIFICATION_REF_TYPE.SURVEY,
      refId: surveyId,
    });
    return target;
  },
  /** Gán hàng loạt — dùng chung logic với surveyService.assignToCustomers(). */
  async assignMany(surveyId, customerIds = []) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);
    const uniqueCustomerIds = [...new Set(customerIds)];
    const targets = uniqueCustomerIds.map((customerId) => ({ surveyId, customerId }));
    const result = await surveyTargetRepository.createMany(targets);
    await notificationService.createMany(
      uniqueCustomerIds.map((customerId) => ({
        customerId,
        type: NOTIFICATION_TYPE.SURVEY_ASSIGNED,
        title: 'Bạn có khảo sát mới',
        message: `Bạn vừa nhận được khảo sát "${survey.title}". Hãy hoàn thành để giúp chúng tôi cải thiện dịch vụ.`,
        refType: NOTIFICATION_REF_TYPE.SURVEY,
        refId: surveyId,
      }))
    );
    return result;
  },
  async remove(surveyId, customerId) {
    const existed = await surveyTargetRepository.findBySurveyAndCustomer(surveyId, customerId);
    if (!existed) throw new NotFoundError(MESSAGES.SURVEY.NOT_TARGETED);
    return surveyTargetRepository.remove(surveyId, customerId);
  },
};
export default surveyTargetService;
