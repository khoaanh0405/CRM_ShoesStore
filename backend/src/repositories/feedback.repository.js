/**
 * Repository cho model Feedback (bảng feedbacks).
 * customer_id -> customers (RESTRICT), product_id -> products (RESTRICT).
 * CHECK (rating BETWEEN 1 AND 5) được enforce ở DB (raw SQL, Prisma không
 * generate) — Repository không tự validate lại rating, để DB là nguồn kiểm
 * tra cuối cùng; nếu invalid, Postgres sẽ throw lỗi constraint (mã 23514),
 * Service layer nên validate rating ở input trước khi gọi xuống để tránh
 * lỗi khó hiểu cho người dùng.
 * Không có bảng con nào tham chiếu feedback_id -> remove() luôn an toàn.
 */
import prisma from '../config/database.js';

export const feedbackRepository = {
  findAll({ status, productId, customerId } = {}) {
    return prisma.feedback.findMany({
      where: {
        ...(status && { status }),
        ...(productId && { productId }),
        ...(customerId && { customerId }),
      },
      orderBy: { createdAt: 'desc' },
      include: { customer: true, product: true },
    });
  },

  findById(feedbackId) {
    return prisma.feedback.findUnique({
      where: { feedbackId },
      include: { customer: true, product: true },
    });
  },

  findByCustomer(customerId) {
    return prisma.feedback.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  },

  findByProduct(productId) {
    return prisma.feedback.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  },

  findByStatus(status) {
    return prisma.feedback.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** Khách hàng gửi phản hồi về sản phẩm (mục 4.3.3). rating: số nguyên 1-5. */
  create({ customerId, productId, title, content, rating, imageUrl }) {
    return prisma.feedback.create({
      data: {
        customerId,
        productId,
        title,
        content,
        rating,
        imageUrl,
        status: 'Pending',
      },
    });
  },

  update(feedbackId, { title, content, rating, imageUrl }) {
    return prisma.feedback.update({
      where: { feedbackId },
      data: { title, content, rating, imageUrl },
    });
  },

  /** Admin tiếp nhận/xử lý phản hồi (mục 4.1.4): 'Pending' | 'Approved' | 'Rejected'. */
  updateStatus(feedbackId, status) {
    return prisma.feedback.update({
      where: { feedbackId },
      data: { status },
    });
  },

  remove(feedbackId) {
    return prisma.feedback.delete({ where: { feedbackId } });
  },
};

export default feedbackRepository;
