import { Prisma } from '@prisma/client';
import { productRepository, supplierRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';

export const productService = {
  list({ includeInactive = false } = {}) {
    return productRepository.findAll({ includeInactive });
  },

  async getById(productId) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('Không tìm thấy sản phẩm.');
    return product;
  },

  listBySupplier(supplierId) {
    return productRepository.findBySupplier(supplierId);
  },

  /** Tìm kiếm nâng cao / lọc / sắp xếp sản phẩm cho Admin (mục II.2). */
  search(params) {
    return productRepository.search(params);
  },

  async create({ supplierId, productName, category, brand, size, color, material, price, stockQuantity, isActive, imageUrl }) {
    if (!productName?.trim()) throw new ValidationError('Tên sản phẩm không được để trống.');

    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      throw new ValidationError('Giá sản phẩm phải là số không âm.');
    }
    if (stockQuantity !== undefined && (!Number.isInteger(Number(stockQuantity)) || Number(stockQuantity) < 0)) {
      throw new ValidationError('Số lượng tồn kho phải là số nguyên không âm.');
    }

    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw new NotFoundError('Không tìm thấy nhà cung cấp.');

    return productRepository.create({
      supplierId,
      productName: productName.trim(),
      category,
      brand,
      size,
      color,
      material,
      price: priceNum,
      stockQuantity,
      isActive,
      imageUrl,
    });
  },

  async update(productId, data) {
    await this.getById(productId);

    if (data.price !== undefined) {
      const priceNum = Number(data.price);
      if (Number.isNaN(priceNum) || priceNum < 0) throw new ValidationError('Giá sản phẩm phải là số không âm.');
      data = { ...data, price: priceNum };
    }
    if (data.supplierId !== undefined) {
      const supplier = await supplierRepository.findById(data.supplierId);
      if (!supplier) throw new NotFoundError('Không tìm thấy nhà cung cấp.');
    }

    return productRepository.update(productId, data);
  },

  /** Ẩn/hiện sản phẩm — lựa chọn an toàn thay cho xóa cứng khi sản phẩm ngừng kinh doanh. */
  async setActive(productId, isActive) {
    await this.getById(productId);
    return productRepository.setActive(productId, isActive);
  },

  /** Xóa cứng — sẽ báo lỗi nghiệp vụ nếu sản phẩm còn feedback liên quan (khuyên dùng setActive thay thế). */
  async remove(productId) {
    await this.getById(productId);
    try {
      return await productRepository.remove(productId);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new ConflictError('Không thể xóa sản phẩm vì đã có phản hồi liên quan. Hãy ẩn sản phẩm (setActive) thay vì xóa.');
      }
      throw err;
    }
  },
};

export default productService;
