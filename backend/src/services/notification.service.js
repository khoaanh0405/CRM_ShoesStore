import { notificationRepository, customerRepository } from '../repositories/index.js';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';
import { MESSAGES } from '../constants/index.js';
export const notificationService = {
  /** Danh sách thông báo của 1 khách hàng — dùng cho chuông thông báo. */
  async listByCustomer(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return notificationRepository.findByCustomer(customerId);
  },
  async countUnread(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return notificationRepository.countUnread(customerId);
  },
  /** Dùng nội bộ bởi feedback.service.js / surveyTarget.service.js khi có sự kiện cần báo cho khách hàng. */
  create({ customerId, type, title, message, refType, refId }) {
    return notificationRepository.create({ customerId, type, title, message, refType, refId });
  },
  createMany(notifications) {
    if (!notifications.length) return Promise.resolve({ count: 0 });
    return notificationRepository.createMany(notifications);
  },
  /** Khách hàng đánh dấu đã đọc 1 thông báo — chỉ được đánh dấu thông báo của chính mình. */
  async markRead(notificationId, requesterCustomerId) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification) throw new NotFoundError(MESSAGES.NOT_FOUND.NOTIFICATION);
    if (requesterCustomerId != null && notification.customerId !== requesterCustomerId) {
      throw new ForbiddenError('Bạn không có quyền thao tác trên thông báo này.');
    }
    return notificationRepository.markRead(notificationId);
  },
  async markAllRead(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return notificationRepository.markAllRead(customerId);
  },
};
export default notificationService;
