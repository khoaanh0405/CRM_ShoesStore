import prisma from '../config/database.js';

const REPLIES = {
  where: { isDeleted: false },
  orderBy: { createdAt: 'asc' },
  include: { account: { select: { accountId: true, username: true } } },
};
const ALIVE = { isDeleted: false };

export const feedbackRepository = {
  findAll({ status, productId, customerId } = {}) {
    return prisma.feedback.findMany({
      where: {
        ...ALIVE,
        ...(status && { status }),
        ...(productId && { productId }),
        ...(customerId && { customerId }),
      },
      orderBy: { feedbackId: 'desc' },
      include: { customer: true, product: true, replies: REPLIES },
    });
  },

  findById(feedbackId) {
    return prisma.feedback.findFirst({
      where: { feedbackId, ...ALIVE },
      include: { customer: true, product: true, replies: REPLIES },
    });
  },

  findByCustomer(customerId) {
    return prisma.feedback.findMany({
      where: { customerId, ...ALIVE },
      orderBy: { feedbackId: 'desc' },
      include: { replies: REPLIES },
    });
  },

  findByProduct(productId) {
    return prisma.feedback.findMany({
      where: { productId, ...ALIVE },
      orderBy: { feedbackId: 'desc' },
      include: { replies: REPLIES },
    });
  },

  findByStatus(status) {
    return prisma.feedback.findMany({ where: { status, ...ALIVE }, orderBy: { feedbackId: 'desc' } });
  },

  create({ customerId, productId, title, content, rating, imageUrl }) {
    return prisma.feedback.create({
      data: { customerId, productId, title, content, rating, imageUrl, status: 'Pending' },
    });
  },

  update(feedbackId, { title, content, rating, imageUrl }) {
    return prisma.feedback.update({ where: { feedbackId }, data: { title, content, rating, imageUrl } });
  },

  updateStatus(feedbackId, status) {
    return prisma.feedback.update({ where: { feedbackId }, data: { status } });
  },

  /** XÓA MỀM: giữ lại dữ liệu, chỉ ẩn khỏi mọi danh sách. */
  remove(feedbackId) {
    return prisma.feedback.update({
      where: { feedbackId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },
};

export default feedbackRepository;