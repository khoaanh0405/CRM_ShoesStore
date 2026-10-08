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
    if (await categoryRepository.findByNameExact(name)) throw new ConflictError('Danh mục này đã tồn tại.');
    return categoryRepository.create({ categoryName: name, description: description?.trim() || null });
  },

  async update(categoryId, { categoryName, description }) {
    await this.getById(categoryId);
    const name = categoryName?.trim();
    if (!name) throw new ValidationError('Tên danh mục không được để trống.');
    const existed = await categoryRepository.findByNameExact(name);
    if (existed && existed.categoryId !== categoryId) throw new ConflictError('Danh mục này đã tồn tại.');
    return categoryRepository.update(categoryId, { categoryName: name, description: description?.trim() || null });
  },

  async remove(categoryId) {
    const c = await this.getById(categoryId);
    const count = await categoryRepository.countProducts(categoryId);
    if (count > 0) {
      throw new ConflictError(`Không thể xóa danh mục "${c.categoryName}" vì còn ${count} sản phẩm. Hãy chuyển các sản phẩm sang danh mục khác trước.`);
    }
    await categoryRepository.remove(categoryId);
    return c;
  },
};

export default categoryService;