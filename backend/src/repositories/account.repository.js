/**
 * Repository cho model Account (bảng accounts).
 * roles.role_id -> accounts (RESTRICT), customers.customer_id -> accounts (CASCADE, 1-1).
 * Repository KHÔNG chịu trách nhiệm hash mật khẩu — việc đó thuộc account.service.js.
 */
import prisma from '../config/database.js';

export const accountRepository = {
  /**
   * Danh sách tài khoản kèm role (và customer nếu có) để AccountManagement.tsx
   * hiển thị username, role.roleName, isLocked, createdAt.
   */
  findAll({ roleId } = {}) {
    return prisma.account.findMany({
      where: typeof roleId === 'number' ? { roleId } : undefined,
      orderBy: { accountId: 'asc' },
      include: {
        role: true,
        customer: true,
      },
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

  /** Dùng cho login — cần đủ role + customer để phát hành JWT payload đúng. */
  findByUsernameWithRelations(username) {
    return prisma.account.findUnique({
      where: { username },
      include: { role: true, customer: true },
    });
  },

  create({ username, passwordHash, roleId, isLocked = false }) {
    return prisma.account.create({
      data: { username, passwordHash, roleId, isLocked },
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