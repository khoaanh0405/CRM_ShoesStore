/**
 * Service cho Role — nghiệp vụ mỏng, chủ yếu validate trùng tên vai trò và
 * chuyển lỗi FK (P2003) khi xóa Role còn Account tham chiếu thành lỗi nghiệp
 * vụ dễ hiểu (xem ghi chú role.repository.js).
 */
import { Prisma } from '@prisma/client';
import { roleRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';

export const roleService = {
  list() {
    return roleRepository.findAll();
  },

  async getById(roleId) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw new NotFoundError('Không tìm thấy vai trò.');
    return role;
  },

  async create({ roleName, description }) {
    if (!roleName?.trim()) throw new ValidationError('Tên vai trò không được để trống.');

    const existed = await roleRepository.findByName(roleName.trim());
    if (existed) throw new ConflictError(`Vai trò "${roleName}" đã tồn tại.`);

    return roleRepository.create({ roleName: roleName.trim(), description });
  },

  async update(roleId, { roleName, description }) {
    await this.getById(roleId);

    if (roleName?.trim()) {
      const existed = await roleRepository.findByName(roleName.trim());
      if (existed && existed.roleId !== roleId) {
        throw new ConflictError(`Vai trò "${roleName}" đã tồn tại.`);
      }
    }

    return roleRepository.update(roleId, { roleName: roleName?.trim(), description });
  },

  /** Xóa cứng Role — sẽ báo lỗi nghiệp vụ nếu còn Account đang dùng role này. */
  async remove(roleId) {
    await this.getById(roleId);
    try {
      return await roleRepository.remove(roleId);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictError('Không thể xóa vai trò vì vẫn còn tài khoản đang sử dụng.');
      }
      throw err;
    }
  },
};

export default roleService;
