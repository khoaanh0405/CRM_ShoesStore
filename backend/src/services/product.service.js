import { productRepository, supplierRepository } from '../repositories/index.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { MESSAGES } from '../constants/index.js';
import { isForeignKeyError } from '../utils/index.js';

async function assertCategory(categoryId) {
  if (categoryId === undefined || categoryId === null || categoryId === '') return null;
  const id = Number(categoryId);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Danh mục không hợp lệ.');
  const c = await categoryRepository.findById(id);
  if (!c) throw new NotFoundError('Không tìm thấy danh mục.');
  return id;
}

export const productService = {
  list({ includeInactive = false } = {}) {
    return productRepository.findAll({ includeInactive });
  },

  async getById(productId) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError(MESSAGES.NOT_FOUND.PRODUCT);
    return product;
  },

  listBySupplier(supplierId) {
    return productRepository.findBySupplier(supplierId);
  },

  search(params) {
    return productRepository.search(params);
  },

  async create({ supplierId, categoryId, productName, brand, size, color, material, price, stockQuantity, isActive, imageUrl }) {
    if (!productName?.trim()) throw new ValidationError('Tên sản phẩm không được để trống.');

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) throw new ValidationError('Giá sản phẩm phải là số không âm.');
    if (stockQuantity !== undefined && (!Number.isInteger(Number(stockQuantity)) || Number(stockQuantity) < 0)) {
      throw new ValidationError('Số lượng tồn kho phải là số nguyên không âm.');
    }

    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw new NotFoundError(MESSAGES.NOT_FOUND.SUPPLIER);
    const resolvedCategoryId = await assertCategory(categoryId);

    return productRepository.create({
      supplierId, categoryId: resolvedCategoryId, productName: productName.trim(),
      brand, size, color, material, description: description?.trim() || null,
      price: priceNum, stockQuantity, isActive, imageUrl,
    });
  },

  async update(productId, data) {
    await this.getById(productId);
    // `category` (string) không còn là cột — bỏ nếu client cũ vẫn gửi lên
    const { category: _ignored, categoryId, ...rest } = data;
    let next = { ...rest };

    if (next.price !== undefined) {
      const priceNum = Number(next.price);
      if (Number.isNaN(priceNum) || priceNum < 0) throw new ValidationError('Giá sản phẩm phải là số không âm.');
      next.price = priceNum;
    }
    if (next.supplierId !== undefined) {
      const supplier = await supplierRepository.findById(next.supplierId);
      if (!supplier) throw new NotFoundError(MESSAGES.NOT_FOUND.SUPPLIER);
    }
    if (categoryId !== undefined) next.categoryId = await assertCategory(categoryId);

    return productRepository.update(productId, next);
  },

  async setActive(productId, isActive) {
    await this.getById(productId);
    return productRepository.setActive(productId, isActive);
  },

  async remove(productId) {
    await this.getById(productId);
    try {
      return await productRepository.remove(productId);
    } catch (err) {
      if (isForeignKeyError(err)) {
        throw new ConflictError('Không thể xóa sản phẩm vì đã có phản hồi liên quan. Hãy ẩn sản phẩm (setActive) thay vì xóa.');
      }
      throw err;
    }
  },
};

export default productService;