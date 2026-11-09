import prisma from '../config/database.js';

export const roleRepository = {
  findAll() {
    return prisma.role.findMany({ orderBy: { roleId: 'asc' } });
  },

  findById(roleId) {
    return prisma.role.findUnique({ where: { roleId } });
  },

  findByName(roleName) {
    return prisma.role.findUnique({ where: { roleName } });
  },

  /** Bao gồm cả danh sách account đang dùng role này (hữu ích khi cần kiểm tra trước khi xóa/sửa). */
  findByIdWithAccounts(roleId) {
    return prisma.role.findUnique({
      where: { roleId },
      include: { accounts: true },
    });
  },

  create({ roleName, description }) {
    return prisma.role.create({
      data: { roleName, description },
    });
  },

  update(roleId, { roleName, description }) {
    return prisma.role.update({
      where: { roleId },
      data: { roleName, description },
    });
  },

  /**
   * Xóa cứng Role. Sẽ throw lỗi Prisma (P2003) nếu còn accounts.role_id tham
   * chiếu tới role này (đúng theo FK RESTRICT trong migration) — Service layer
   * cần bắt lỗi này và báo cho người dùng thay vì để crash.
   */
  remove(roleId) {
    return prisma.role.delete({ where: { roleId } });
  },
};

export default roleRepository;
