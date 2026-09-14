/**
 * Repository cho model Product (bảng products).
 * products.supplier_id -> suppliers (RESTRICT).
 * feedbacks.product_id -> products (RESTRICT): nếu product còn feedback thì
 * remove() sẽ throw lỗi FK (P2003) — Service layer xử lý.
 * products.is_active đã có sẵn trong schema để "ẩn/hiện" sản phẩm mà không
 * cần xóa cứng -> setActive() là lựa chọn an toàn hơn cho nghiệp vụ ẩn sản
 * phẩm ngừng kinh doanh; remove() vẫn được cung cấp cho trường hợp Admin
 * thật sự muốn xóa (Service tự quyết định dùng hàm nào).
 */
import prisma from '../config/database.js';

export const productRepository = {
  findAll({ includeInactive = false } = {}) {
    return prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { productId: 'asc' },
      include: { supplier: true },
    });
  },

  findById(productId) {
    return prisma.product.findUnique({
      where: { productId },
      include: { supplier: true },
    });
  },

  findBySupplier(supplierId) {
    return prisma.product.findMany({
      where: { supplierId },
      orderBy: { productId: 'asc' },
    });
  },

  /**
   * Tìm kiếm nâng cao / lọc / sắp xếp sản phẩm cho Admin (yêu cầu mục II.2).
   * Tất cả tham số đều optional.
   */
  search({
    keyword,
    category,
    brand,
    minPrice,
    maxPrice,
    isActive,
    sortBy = 'productId',
    sortOrder = 'asc',
  } = {}) {
    return prisma.product.findMany({
      where: {
        ...(keyword && {
          productName: { contains: keyword, mode: 'insensitive' },
        }),
        ...(category && { category }),
        ...(brand && { brand }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }),
      },
      orderBy: { [sortBy]: sortOrder },
      include: { supplier: true },
    });
  },

  create({
    supplierId,
    productName,
    category,
    brand,
    size,
    color,
    material,
    price,
    stockQuantity = 0,
    isActive = true,
    imageUrl,
  }) {
    return prisma.product.create({
      data: {
        supplierId,
        productName,
        category,
        brand,
        size,
        color,
        material,
        price,
        stockQuantity,
        isActive,
        imageUrl,
      },
    });
  },

  update(productId, data) {
    return prisma.product.update({ where: { productId }, data });
  },

  /** Ẩn/hiện sản phẩm (soft toggle) — thay thế an toàn cho xóa cứng. */
  setActive(productId, isActive) {
    return prisma.product.update({
      where: { productId },
      data: { isActive },
    });
  },

  remove(productId) {
    return prisma.product.delete({ where: { productId } });
  },
};

export default productRepository;
