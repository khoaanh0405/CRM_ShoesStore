/**
 * Service cho Feedback. Validate rating (1-5 nguyên) TRƯỚC khi gọi Repository
 * — đúng khuyến nghị trong feedback.repository.js ("Service layer nên
 * validate rating ở input trước khi gọi xuống để tránh lỗi khó hiểu cho
 * người dùng" thay vì để Postgres throw lỗi CHECK constraint 23514).
 */
import { feedbackRepository, customerRepository, productRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { FEEDBACK_STATUS_LIST, FEEDBACK_RATING, MESSAGES } from '../constants/index.js';

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

  listByProduct(productId) {
    return feedbackRepository.findByProduct(productId);
  },

  listByStatus(status) {
    return feedbackRepository.findByStatus(status);
  },

  /** Khách hàng gửi phản hồi về sản phẩm (mục 4.3.3). Luôn khởi tạo status = 'Pending'. */
  async create({ customerId, productId, title, content, rating, imageUrl }) {
    if (!title?.trim() || !content?.trim()) {
      throw new ValidationError('Tiêu đề và nội dung phản hồi không được để trống.');
    }
    const ratingNum = assertValidRating(rating);

    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);

    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError(MESSAGES.NOT_FOUND.PRODUCT);

    return feedbackRepository.create({
      customerId,
      productId,
      title: title.trim(),
      content: content.trim(),
      rating: ratingNum,
      imageUrl,
    });
  },

  /** Khách hàng sửa phản hồi của chính mình. */
  async update(feedbackId, { title, content, rating, imageUrl }) {
    await this.getById(feedbackId);

    if (title !== undefined && !title.trim()) throw new ValidationError('Tiêu đề không được để trống.');
    if (content !== undefined && !content.trim()) throw new ValidationError('Nội dung không được để trống.');

    const ratingNum = rating !== undefined ? assertValidRating(rating) : undefined;

    return feedbackRepository.update(feedbackId, {
      title: title?.trim(),
      content: content?.trim(),
      rating: ratingNum,
      imageUrl,
    });
  },

  /** Admin tiếp nhận/xử lý phản hồi (mục 4.1.4). */
  async updateStatus(feedbackId, status) {
    if (!FEEDBACK_STATUS_LIST.includes(status)) {
      throw new ValidationError(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${FEEDBACK_STATUS_LIST.join(', ')}.`);
    }
    await this.getById(feedbackId);
    return feedbackRepository.updateStatus(feedbackId, status);
  },

  async remove(feedbackId) {
    await this.getById(feedbackId);
    return feedbackRepository.remove(feedbackId);
  },
};

export default feedbackService;
