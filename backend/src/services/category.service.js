import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';

const NOT_FOUND = 'Không tìm thấy danh mục.';

export const categoryService = {
  async list() {
    const rows = await categoryRepository.findAll();
    return rows.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
  },

  async getById(categoryId) {
    const c = await categoryRepository.findById(categoryId);
    if (!c) throw new NotFoundError(NOT_FOUND);
    return c;
  },

  async create({ categoryName, description }) {
    const name = categoryName?.trim();
    if (!name) throw new ValidationError('Tên danh mục không được để trống.');
    const desc = description?.trim() || null;
    const existed = await categoryRepository.findByNameExact(name);
    if (existed) {
      if (!existed.isDeleted) throw new ConflictError('Danh mục này đã tồn tại.');
      return categoryRepository.restore(existed.categoryId, { categoryName: name, description: desc }); // khôi phục bản đã xóa mềm
    }
    return categoryRepository.create({ categoryName: name, description: desc });
  },

  async update(categoryId, { categoryName, description }) {
    await this.getById(categoryId);
    const name = categoryName?.trim();
    if (!name) throw new ValidationError('Tên danh mục không được để trống.');
    const existed = await categoryRepository.findByNameExact(name);
    if (existed && existed.categoryId !== categoryId && !existed.isDeleted) throw new ConflictError('Danh mục này đã tồn tại.');
    return categoryRepository.update(categoryId, { categoryName: name, description: description?.trim() || null });
  },

  async remove(supplierId) {
    await this.getById(supplierId);
    const count = await supplierRepository.countProducts(supplierId);
    if (count > 0) {
      throw new ConflictError(`Không thể xóa nhà cung cấp vì còn ${count} sản phẩm liên kết.`);
    }
    return supplierRepository.remove(supplierId);
  },
};

export default categoryService;