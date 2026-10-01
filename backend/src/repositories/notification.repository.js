/**
 * Repository cho model Notification (bảng notifications).
 * notifications.customer_id -> customers (CASCADE).
 * Dùng cho chuông thông báo phía khách hàng: Admin duyệt/từ chối phản hồi,
 * hoặc gửi khảo sát tới khách hàng sẽ tạo 1 bản ghi ở đây.
 */
import prisma from '../config/database.js';
export const notificationRepository = {
  findByCustomer(customerId) {
    return prisma.notification.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  },
  countUnread(customerId) {
    return prisma.notification.count({
      where: { customerId, isRead: false },
    });
  },
  findById(notificationId) {
    return prisma.notification.findUnique({ where: { notificationId } });
  },
  create({ customerId, type, title, message, refType = null, refId = null }) {
    return prisma.notification.create({
      data: { customerId, type, title, message, refType, refId },
    });
  },
  /** Tạo hàng loạt — dùng khi Admin gửi 1 khảo sát cho nhiều khách hàng cùng lúc. */
  createMany(notifications) {
    return prisma.notification.createMany({ data: notifications });
  },
  markRead(notificationId) {
    return prisma.notification.update({
      where: { notificationId },
      data: { isRead: true },
    });
  },
  markAllRead(customerId) {
    return prisma.notification.updateMany({
      where: { customerId, isRead: false },
      data: { isRead: true },
    });
  },
  remove(notificationId) {
    return prisma.notification.delete({ where: { notificationId } });
  },
};
export default notificationRepository;
