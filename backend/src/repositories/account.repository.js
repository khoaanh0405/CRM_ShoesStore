/**
 * Repository cho model Account (bảng accounts).
 * roles.role_id -> accounts (RESTRICT), customers.customer_id / employees.employee_id -> accounts (CASCADE, 1-1).
 * Repository KHÔNG chịu trách nhiệm hash mật khẩu — việc đó thuộc account.service.js.
 * accounts.email (unique, nullable, luôn chữ thường) — dùng cho Admin/Manager và đồng bộ với email khách hàng.
 */
import prisma from '../config/database.js';

export const accountRepository = {
  findAll({ roleId } = {}) {
    return prisma.account.findMany({
      where: typeof roleId === 'number' ? { roleId } : undefined,
      orderBy: { accountId: 'asc' },
      include: { role: true, customer: true, employee: true },
    });
  },

  findById(accountId) {
    return prisma.account.findUnique({
      where: { accountId },
      include: { role: true, customer: true, employee: true },
    });
  },

  findByUsername(username) {
    return prisma.account.findUnique({ where: { username } });
  },

  /** Tìm theo email (đã chuẩn hóa chữ thường) — dùng kiểm tra trùng email. */
  findByEmail(email) {
    return prisma.account.findUnique({ where: { email } });
  },

  /** Dùng cho login — cần đủ role + customer để phát hành JWT payload đúng. */
  findByUsernameWithRelations(username) {
    return prisma.account.findUnique({
      where: { username },
      include: { role: true, customer: true, employee: true },
    });
  },

  create({ username, email = null, passwordHash, roleId, isLocked = false }) {
    return prisma.account.create({
      data: { username, email, passwordHash, roleId, isLocked },
      include: { role: true, customer: true, employee: true },
    });
  },

  /**
   * Tạo tài khoản nội bộ (Admin/Manager) + hồ sơ Employee trong 1 nested-write (cùng 1 transaction),
   * giống cách tạo Account + Customer. employee_id = account_id nên không cần truyền id.
   */
  createWithEmployee({ username, email, passwordHash, roleId, employee }) {
    return prisma.account.create({
      data: { username, email, passwordHash, roleId, isLocked: false, employee: { create: employee } },
      include: { role: true, customer: true, employee: true },
    });
  },

  update(accountId, data) {
    return prisma.account.update({
      where: { accountId },
      data,
      include: { role: true, customer: true, employee: true },
    });
  },

  lock(accountId) {
    return prisma.account.update({
      where: { accountId },
      data: { isLocked: true },
      include: { role: true, customer: true, employee: true },
    });
  },

  unlock(accountId) {
    return prisma.account.update({
      where: { accountId },
      data: { isLocked: false },
      include: { role: true, customer: true, employee: true },
    });
  },

  updateRole(accountId, roleId) {
    return prisma.account.update({
      where: { accountId },
      data: { roleId },
      include: { role: true, customer: true, employee: true },
    });
  },

  remove(accountId) {
    return prisma.account.delete({ where: { accountId } });
  },
};

export default accountRepository;
