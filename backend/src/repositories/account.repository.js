/**
 * Repository cho model Account (bảng accounts).
 * roles.role_id -> accounts (RESTRICT), customers.customer_id -> accounts (CASCADE, 1-1).
 * Repository KHÔNG chịu trách nhiệm hash mật khẩu — việc đó thuộc account.service.js.
 * accounts.email (unique, nullable, luôn chữ thường) — dùng cho Admin/Manager và đồng bộ với email khách hàng.
 */
import prisma from '../config/database.js';

export const accountRepository = {
  findAll({ roleId } = {}) {
    return prisma.account.findMany({
      where: typeof roleId === 'number' ? { roleId } : undefined,
      orderBy: { accountId: 'asc' },
      include: { role: true, customer: true },
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

  /** Tìm theo email (đã chuẩn hóa chữ thường) — dùng kiểm tra trùng email. */
  findByEmail(email) {
    return prisma.account.findUnique({ where: { email } });
  },

  /** Dùng cho login — cần đủ role + customer để phát hành JWT payload đúng. */
  findByUsernameWithRelations(username) {
    return prisma.account.findUnique({
      where: { username },
      include: { role: true, customer: true },
    });
  },

  create({ username, email = null, passwordHash, roleId, isLocked = false }) {
    return prisma.account.create({
      data: { username, email, passwordHash, roleId, isLocked },
      include: { role: true, customer: true },
    });
  },

  update(accountId, data) {
    return prisma.account.update({
      where: { accountId },
      data,
      include: { role: true, customer: true },
    });
  },

  lock(accountId) {
    return prisma.account.update({
      where: { accountId },
      data: { isLocked: true },
      include: { role: true, customer: true },
    });
  },

  unlock(accountId) {
    return prisma.account.update({
      where: { accountId },
      data: { isLocked: false },
      include: { role: true, customer: true },
    });
  },

  updateRole(accountId, roleId) {
    return prisma.account.update({
      where: { accountId },
      data: { roleId },
      include: { role: true, customer: true },
    });
  },

  remove(accountId) {
    return prisma.account.delete({ where: { accountId } });
  },
};

export default accountRepository;
