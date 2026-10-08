import { reviewReplyRepository } from '../repositories/reviewReply.repository.js';
import { feedbackRepository } from '../repositories/feedback.repository.js';
import { notificationService } from './notification.service.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../errors/AppError.js';
import { MESSAGES } from '../constants/index.js';
import { NOTIFICATION_TYPE, NOTIFICATION_REF_TYPE } from '../constants/notification.constant.js';

const MAX_LEN = 2000;

function cleanContent(content) {
  const text = String(content ?? '').trim();
  if (!text) throw new ValidationError('Nội dung phản hồi không được để trống.');
  if (text.length > MAX_LEN) throw new ValidationError(`Nội dung phản hồi tối đa ${MAX_LEN} ký tự.`);
  return text;
}

export const reviewReplyService = {
  async listByFeedback(feedbackId) {
    const fb = await feedbackRepository.findById(feedbackId);
    if (!fb) throw new NotFoundError(MESSAGES.NOT_FOUND.FEEDBACK);
    return reviewReplyRepository.findByFeedback(feedbackId);
  },

  async getById(replyId) {
    const r = await reviewReplyRepository.findById(replyId);
    if (!r) throw new NotFoundError('Không tìm thấy phản hồi.');
    return r;
  },

  async create(feedbackId, accountId, content) {
    const text = cleanContent(content);
    const fb = await feedbackRepository.findById(feedbackId);
    if (!fb) throw new NotFoundError(MESSAGES.NOT_FOUND.FEEDBACK);
    const reply = await reviewReplyRepository.create({ feedbackId, accountId, content: text });

    // Báo cho khách hàng (không để lỗi thông báo làm hỏng việc trả lời)
    try {
      await notificationService.create({
        customerId: fb.customerId,
        type: NOTIFICATION_TYPE.FEEDBACK_REPLIED,
        title: 'Cửa hàng đã phản hồi đánh giá của bạn',
        message: `Đánh giá "${fb.title}" của bạn vừa nhận được phản hồi từ cửa hàng.`,
        refType: NOTIFICATION_REF_TYPE.FEEDBACK,
        refId: feedbackId,
      });
    } catch (e) {
      console.error('[REPLY] Không tạo được thông báo:', e.message);
    }
    return reply;
  },

  /** Chỉ người viết mới được sửa/xóa phản hồi của mình. */
  async update(replyId, accountId, content) {
    const r = await this.getById(replyId);
    if (r.accountId !== accountId) throw new ForbiddenError('Bạn chỉ được sửa phản hồi của chính mình.');
    return reviewReplyRepository.update(replyId, cleanContent(content));
  },

  async remove(replyId, accountId) {
    const r = await this.getById(replyId);
    if (r.accountId !== accountId) throw new ForbiddenError('Bạn chỉ được xóa phản hồi của chính mình.');
    await reviewReplyRepository.remove(replyId);
    return r;
  },
};

export default reviewReplyService;