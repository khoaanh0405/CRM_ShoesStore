import prisma from '../config/database.js';

const WITH_ACCOUNT = { account: { select: { accountId: true, username: true } } };

export const reviewReplyRepository = {
  findByFeedback(feedbackId) {
    return prisma.reviewReply.findMany({
      where: { feedbackId },
      orderBy: { createdAt: 'asc' },
      include: WITH_ACCOUNT,
    });
  },
  findById(replyId) {
    return prisma.reviewReply.findUnique({ where: { replyId }, include: WITH_ACCOUNT });
  },
  create({ feedbackId, accountId, content }) {
    return prisma.reviewReply.create({ data: { feedbackId, accountId, content }, include: WITH_ACCOUNT });
  },
  update(replyId, content) {
    return prisma.reviewReply.update({ where: { replyId }, data: { content }, include: WITH_ACCOUNT });
  },
  remove(replyId) {
    return prisma.reviewReply.delete({ where: { replyId } });
  },
};

export default reviewReplyRepository;