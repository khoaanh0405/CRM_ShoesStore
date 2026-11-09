import { feedbackRepository, customerRepository, productRepository } from '../repositories/index.js';
import { contentModerationService } from './contentModeration.service.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { FEEDBACK_STATUS, FEEDBACK_RATING, MESSAGES } from '../constants/index.js';

function assertValidRating(rating) {
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < FEEDBACK_RATING.MIN || ratingNum > FEEDBACK_RATING.MAX) {
    throw new ValidationError(`Đánh giá (rating) phải là số nguyên từ ${FEEDBACK_RATING.MIN} đến ${FEEDBACK_RATING.MAX}.`);
  }
  return ratingNum;
}
export const feedbackService = {
  list(filters) {
    return feedbackRepository.findAll(filters);
  },
  async getById(feedbackId) {
    const feedback = await feedbackRepository.findById(feedbackId);
    if (!feedback) throw new NotFoundError(MESSAGES.NOT_FOUND.FEEDBACK);
    return feedback;
  },
  listByCustomer(customerId) {
    return feedbackRepository.findByCustomer(customerId);
  },
  /** Chỉ trả các đánh giá đang hiển thị công khai (loại các đánh giá cũ đã bị gỡ/Rejected). */
  listByProduct(productId) {
    return feedbackRepository.findByProduct(productId, FEEDBACK_STATUS.APPROVED);
  },
  listByStatus(status) {
    return feedbackRepository.findByStatus(status);
  },
  /**
   * Khách hàng gửi phản hồi về sản phẩm (mục 4.3.3).
   * Kiểm duyệt tự động -> hợp lệ thì lưu và hiển thị ngay (status = 'Approved').
   */
  async create({ customerId, productId, content, rating, imageUrl }) {
    const ratingNum = assertValidRating(rating);
    const clean = contentModerationService.moderateFeedback({ content: content ?? '' });
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError(MESSAGES.NOT_FOUND.PRODUCT);
    return feedbackRepository.create({
      customerId,
      productId,
      content: clean.content,
      rating: ratingNum,
      imageUrl,
      status: FEEDBACK_STATUS.APPROVED,
    });
  },
  /** Khách hàng sửa phản hồi của chính mình — nội dung mới cũng phải qua kiểm duyệt. */
  async update(feedbackId, { content, rating, imageUrl }) {
    await this.getById(feedbackId);
    const clean = contentModerationService.moderateFeedback({ content });
    const ratingNum = rating !== undefined ? assertValidRating(rating) : undefined;
    return feedbackRepository.update(feedbackId, {
      content: clean.content,
      rating: ratingNum,
      imageUrl: imageUrl === '' ? null : imageUrl, // '' = khách xóa ảnh
    });
  },
  /**
   * Manager ẩn / hiện lại một đánh giá đã đăng.
   * Không đổi schema: ẩn = status 'Rejected' (không còn hiển thị công khai), hiện lại = 'Approved'.
   * Idempotent: đã ở đúng trạng thái thì trả về luôn.
   */
  async setHidden(feedbackId, hidden) {
    const feedback = await this.getById(feedbackId);
    const target = hidden ? FEEDBACK_STATUS.REJECTED : FEEDBACK_STATUS.APPROVED;
    if (feedback.status === target) return feedback;
    return feedbackRepository.updateStatus(feedbackId, target);
  },
  async remove(feedbackId) {
    await this.getById(feedbackId);
    return feedbackRepository.remove(feedbackId);
  },
};
export default feedbackService;
