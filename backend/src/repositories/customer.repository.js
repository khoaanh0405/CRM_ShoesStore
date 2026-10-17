/**
 * Repository cho model Customer (bảng customers).
 *
 * customers.customer_id KHÔNG tự tăng — nó CHÍNH LÀ accounts.account_id
 * (quan hệ 1-1 dùng chung PK, onDelete Cascade từ phía Account -> Customer).
 *
 * "Xóa khách hàng" (4.1.2) = SOFT DELETE (is_deleted/deleted_at) — KHÔNG có hàm hard delete.
 *
 * Mọi danh sách khách hàng CHỈ gồm tài khoản có vai trò Customer (ONLY_CUSTOMER_ROLE),
 * kể cả khi một tài khoản từng là khách hàng rồi được đổi sang Admin/Manager.
 */
import prisma from '../config/database.js';
import { ROLE_NAMES } from '../constants/index.js';

const ONLY_CUSTOMER_ROLE = { account: { role: { roleName: ROLE_NAMES.CUSTOMER } } };

export const customerRepository = {
  findAll({ includeDeleted = false } = {}) {
    return prisma.customer.findMany({
      where: { ...ONLY_CUSTOMER_ROLE, ...(includeDeleted ? {} : { isDeleted: false }) },
      orderBy: { customerId: 'asc' },
      include: { customerPreferences: { include: { category: { select: { categoryId: true, categoryName: true, isDeleted: true } } } }, account: { select: { isLocked: true } } },
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

  /** Tìm theo email (đã chuẩn hóa chữ thường) — dùng cho quên mật khẩu và kiểm tra trùng email. */
  findByEmail(email) {
    return prisma.customer.findUnique({
      where: { email },
      include: { account: true },
    });
  },

  findByIdWithPreferences(customerId) {
    return prisma.customer.findUnique({
      where: { customerId },
      include: { customerPreferences: { include: { category: { select: { categoryId: true, categoryName: true, isDeleted: true } } } } },
    });
  },

  /**
   * Tìm theo họ tên hoặc email. Họ tên được lưu tách (lastName/firstName) nên từ khóa được tách thành
   * từng từ; mỗi từ phải khớp họ HOẶC tên (vd "văn an" khớp lastName "Nguyễn Văn" + firstName "An").
   * Sắp xếp theo Tên rồi tới Họ (cách xếp tên người Việt).
   */
  search({ keyword, gender, includeDeleted = false } = {}) {
    const k = keyword?.trim();
    const tokens = k ? k.split(/\s+/) : [];
    return prisma.customer.findMany({
      where: {
        ...ONLY_CUSTOMER_ROLE,
        ...(includeDeleted ? {} : { isDeleted: false }),
        ...(k && {
          OR: [
            {
              AND: tokens.map((t) => ({
                OR: [
                  { firstName: { contains: t, mode: 'insensitive' } },
                  { lastName: { contains: t, mode: 'insensitive' } },
                ],
              })),
            },
            { email: { contains: k, mode: 'insensitive' } },
          ],
        }),
        ...(gender && { gender }),
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  },

  /**
   * customerId phải là account_id của 1 Account (role Customer) đã tồn tại
   * từ trước — xem ghi chú đầu file.
   */
  create({ customerId, firstName, lastName, dateOfBirth, gender, phone, email, address }) {
    return prisma.customer.create({
      data: { customerId, firstName, lastName, dateOfBirth, gender, phone, email, address },
    });
  },

  update(customerId, { firstName, lastName, dateOfBirth, gender, phone, email, address }) {
    return prisma.customer.update({
      where: { customerId },
      data: { firstName, lastName, dateOfBirth, gender, phone, email, address },
    });
  },

  /** Soft delete — nghiệp vụ 4.1.2 "Xóa khách hàng". */
  softDelete(customerId) {
    return prisma.customer.update({
      where: { customerId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  /** Thống kê tỷ lệ giới tính (mục 4.1.5) — chỉ tính khách hàng. */
  countByGender({ includeDeleted = false } = {}) {
    return prisma.customer.groupBy({
      by: ['gender'],
      where: { ...ONLY_CUSTOMER_ROLE, ...(includeDeleted ? {} : { isDeleted: false }) },
      _count: { _all: true },
    });
  },
};

export default customerRepository;
