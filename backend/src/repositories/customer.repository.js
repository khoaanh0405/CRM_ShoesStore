/**
 * Repository cho model Customer (bảng customers).
 *
 * customers.customer_id KHÔNG tự tăng — nó CHÍNH LÀ accounts.account_id
 * (quan hệ 1-1 dùng chung PK, onDelete Cascade từ phía Account -> Customer).
 * => create() bắt buộc phải nhận customerId của 1 Account đã tồn tại (role
 * Customer), Repository này KHÔNG tự tạo Account. Việc tạo Account trước rồi
 * tạo Customer sau nên được điều phối ở Service layer (transaction) hoặc
 * dùng prisma.account.create({ data: { ..., customer: { create: {...} } } }).
 *
 * "Xóa khách hàng" (4.1.2) = SOFT DELETE (is_deleted/deleted_at) theo đúng
 * comment trong schema.prisma — KHÔNG có hàm hard delete ở đây. Sau khi
 * isDeleted=true, khách hàng biến mất khỏi danh sách hoạt động nhưng toàn bộ
 * Feedback/SurveyResponse lịch sử vẫn giữ nguyên.
 */
import prisma from '../config/database.js';

export const customerRepository = {
  /** Mặc định chỉ trả về khách hàng đang hoạt động (is_deleted = false). */
  findAll({ includeDeleted = false } = {}) {
    return prisma.customer.findMany({
      where: includeDeleted ? undefined : { isDeleted: false },
      orderBy: { customerId: 'asc' },
    });
  },

  findById(customerId, { includeDeleted = false } = {}) {
    return prisma.customer.findFirst({
      where: {
        customerId,
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
    });
  },

  /** Lấy kèm account (username, isLocked) — cần cho trang chi tiết/khóa tài khoản. */
  findByIdWithAccount(customerId) {
    return prisma.customer.findUnique({
      where: { customerId },
      include: { account: true },
    });
  },

  findByIdWithPreferences(customerId) {
    return prisma.customer.findUnique({
      where: { customerId },
      include: { customerPreferences: true },
    });
  },

  search({ keyword, gender, includeDeleted = false } = {}) {
    return prisma.customer.findMany({
      where: {
        ...(includeDeleted ? {} : { isDeleted: false }),
        ...(keyword && { fullName: { contains: keyword, mode: 'insensitive' } }),
        ...(gender && { gender }),
      },
      orderBy: { fullName: 'asc' },
    });
  },

  /**
   * customerId phải là account_id của 1 Account (role Customer) đã tồn tại
   * từ trước — xem ghi chú đầu file.
   */
  create({ customerId, fullName, dateOfBirth, gender, phone, address }) {
    return prisma.customer.create({
      data: { customerId, fullName, dateOfBirth, gender, phone, address },
    });
  },

  update(customerId, { fullName, dateOfBirth, gender, phone, address }) {
    return prisma.customer.update({
      where: { customerId },
      data: { fullName, dateOfBirth, gender, phone, address },
    });
  },

  /** Soft delete — nghiệp vụ 4.1.2 "Xóa khách hàng". */
  softDelete(customerId) {
    return prisma.customer.update({
      where: { customerId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  /** Thống kê tỷ lệ giới tính (mục 4.1.5 "Báo cáo về khách hàng, tỷ lệ độ tuổi, sở thích"). */
  countByGender({ includeDeleted = false } = {}) {
    return prisma.customer.groupBy({
      by: ['gender'],
      where: includeDeleted ? undefined : { isDeleted: false },
      _count: { _all: true },
    });
  },
};

export default customerRepository;
