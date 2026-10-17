import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';

const NOT_FOUND = 'Không tìm thấy danh mục.';

export const categoryService = {
  /** withProducts = true: chỉ danh mục đang có sản phẩm (dùng cho mục "Sở thích mua sắm" của khách hàng). */
  async list({ withProducts = false } = {}) {
    const rows = await categoryRepository.findAll();
    const mapped = rows.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
    return withProducts ? mapped.filter((c) => c.productCount > 0) : mapped;
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

  async remove(categoryId) {
    await this.getById(categoryId);
    const count = await categoryRepository.countProducts(categoryId);
    if (count > 0) {
      throw new ConflictError(`Không thể xóa danh mục vì còn ${count} sản phẩm thuộc danh mục này.`);
    }
    return categoryRepository.remove(categoryId); // xóa mềm
  },
};

export default categoryService;
