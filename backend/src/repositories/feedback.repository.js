/**
 * Repository cho Feedback. Mọi truy vấn đọc đều kèm `replies` (ReviewReply)
 * để Manager xem và khách hàng thấy phản hồi của cửa hàng.
 */
import prisma from '../config/database.js';

const REPLIES = {
  orderBy: { createdAt: 'asc' },
  include: { account: { select: { accountId: true, username: true } } },
};

export const feedbackRepository = {
  findAll({ status, productId, customerId } = {}) {
    return prisma.feedback.findMany({
      where: {
        ...(status && { status }),
        ...(productId && { productId }),
        ...(customerId && { customerId }),
      },
      orderBy: { feedbackId: 'desc' },
      include: { customer: true, product: true, replies: REPLIES },
    });
  },

  findById(feedbackId) {
    return prisma.feedback.findUnique({
      where: { feedbackId },
      include: { customer: true, product: true, replies: REPLIES },
    });
  },

  findByCustomer(customerId) {
    return prisma.feedback.findMany({
      where: { customerId },
      orderBy: { feedbackId: 'desc' },
      include: { replies: REPLIES },
    });
  },

  findByProduct(productId) {
    return prisma.feedback.findMany({
      where: { productId },
      orderBy: { feedbackId: 'desc' },
      include: { replies: REPLIES },
    });
  },

  findByStatus(status) {
    return prisma.feedback.findMany({ where: { status }, orderBy: { createdAt: 'desc' } });
  },

  create({ customerId, productId, title, content, rating, imageUrl }) {
    return prisma.feedback.create({
      data: { customerId, productId, title, content, rating, imageUrl, status: 'Pending' },
    });
  },

  update(feedbackId, { title, content, rating, imageUrl }) {
    return prisma.feedback.update({
      where: { feedbackId },
      data: { title, content, rating, imageUrl },
    });
  },

  updateStatus(feedbackId, status) {
    return prisma.feedback.update({ where: { feedbackId }, data: { status } });
  },

  remove(feedbackId) {
    return prisma.feedback.delete({ where: { feedbackId } });
  },
};

export default feedbackRepository;