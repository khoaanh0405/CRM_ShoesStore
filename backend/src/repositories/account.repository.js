/**
 * Repository cho model Account (bảng accounts).
 *
 * LƯU Ý NGHIỆP VỤ QUAN TRỌNG (đã thống nhất, không hard-delete):
 * - accounts.role_id -> roles (RESTRICT).
 * - customers.customer_id -> accounts.account_id (CASCADE) là quan hệ 1-1 dùng
 *   chung PK (Customer "kế thừa" Account). Nếu hard-delete 1 Account có Customer,
 *   Postgres sẽ cascade xóa luôn Customer — nhưng nghiệp vụ "Xóa khách hàng"
 *   (4.1.2) đã được thiết kế là SOFT DELETE (Customer.isDeleted), tuyệt đối
 *   không được xóa cứng để không mất lịch sử Feedback/Survey của khách hàng.
 * - Vì vậy Repository này KHÔNG expose hàm delete() vật lý. "Khóa tài khoản"
 *   (4.1.3, cả cho account thường lẫn ngăn đăng nhập) dùng lock()/unlock()
 *   (toggle accounts.is_locked) — đây là cơ chế "vô hiệu hóa" account thay thế
 *   cho việc xóa. Nếu về sau thật sự cần xóa cứng Account KHÔNG có Customer
 *   liên kết (ví dụ 1 account Admin tạo nhầm), hãy bổ sung hàm riêng có kiểm
 *   tra tường minh, không dùng chung với account có Customer.
 */
import prisma from '../config/database.js';

export const accountRepository = {
  findAll({ roleId } = {}) {
    return prisma.account.findMany({
      where: roleId ? { roleId } : undefined,
      orderBy: { accountId: 'asc' },
      include: { role: true },
    });
  },

  findById(accountId) {
    return prisma.account.findUnique({
      where: { accountId },
      include: { role: true, customer: true },
    });
  },

  findByUsername(username) {
    return prisma.account.findUnique({ where: { username } });
  },

  /** Dùng cho luồng đăng nhập: cần role (phân quyền) + customer (nếu có) trong 1 lần query. */
  findByUsernameWithRelations(username) {
    return prisma.account.findUnique({
      where: { username },
      include: { role: true, customer: true },
    });
  },

  /**
   * Tạo Account mới. passwordHash phải được hash sẵn (bcrypt) trước khi gọi
   * xuống Repository — Repository không chịu trách nhiệm hash mật khẩu.
   */
  create({ username, passwordHash, roleId, isLocked = false }) {
    return prisma.account.create({
      data: { username, passwordHash, roleId, isLocked },
    });
  },

  /** Cập nhật thông tin account (không đổi role qua hàm này, xem updateRole). */
  update(accountId, { username, passwordHash }) {
    return prisma.account.update({
      where: { accountId },
      data: { username, passwordHash },
    });
  },

  /** Admin phân quyền lại cho account (đổi role_id). */
  updateRole(accountId, roleId) {
    return prisma.account.update({
      where: { accountId },
      data: { roleId },
    });
  },

  /** Khóa tài khoản — dùng cho nghiệp vụ 4.1.3 "Khóa tài khoản khách hàng" và Admin khóa account nói chung. */
  lock(accountId) {
    return prisma.account.update({
      where: { accountId },
      data: { isLocked: true },
    });
  },

  unlock(accountId) {
    return prisma.account.update({
      where: { accountId },
      data: { isLocked: false },
    });
  },
};

export default accountRepository;
