import prisma from '../config/database.js';

const WITH_ACCOUNT = { account: { select: { accountId: true, username: true } } };

export const reviewReplyRepository = {
  findByFeedback(feedbackId) {
    return prisma.reviewReply.findMany({
      where: { feedbackId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: WITH_ACCOUNT,
    });
  },
  findById(replyId) {
    return prisma.reviewReply.findFirst({ where: { replyId, isDeleted: false }, include: WITH_ACCOUNT });
  },
  create({ feedbackId, accountId, content }) {
    return prisma.reviewReply.create({ data: { feedbackId, accountId, content }, include: WITH_ACCOUNT });
  },
  update(replyId, content) {
    return prisma.reviewReply.update({ where: { replyId }, data: { content }, include: WITH_ACCOUNT });
  },
  /** XÓA MỀM */
  remove(replyId) {
    return prisma.reviewReply.update({
      where: { replyId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },
};

export default reviewReplyRepository;