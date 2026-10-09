/**
 * Repository cho Product. Category là bảng riêng (categoryId FK).
 * Kết quả trả ra được "làm phẳng": giữ `categoryId` và `category` = TÊN danh mục (string)
 * để frontend cũ (lọc, hiển thị, gợi ý) vẫn chạy.
 */
import prisma from '../config/database.js';

const INCLUDE = { supplier: true, category: true };

function flatten(p) {
  if (!p) return p;
  const { category, ...rest } = p;
  return { ...rest, category: category?.categoryName ?? null };
}

export const productRepository = {
  async findAll({ includeInactive = false } = {}) {
    const rows = await prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { productId: 'asc' },
      include: INCLUDE,
    });
    return rows.map(flatten);
  },

  async findById(productId) {
    return flatten(await prisma.product.findUnique({ where: { productId }, include: INCLUDE }));
  },

  async findBySupplier(supplierId) {
    const rows = await prisma.product.findMany({
      where: { supplierId }, orderBy: { productId: 'asc' }, include: { category: true },
    });
    return rows.map(flatten);
  },

  /** category = TÊN danh mục (giữ tương thích với customer web). */
  async search({
    keyword, category, categoryId, brand, minPrice, maxPrice, isActive,
    sortBy = 'productId', sortOrder = 'asc',
  } = {}) {
    const orderBy = sortBy === 'category'
      ? { category: { categoryName: sortOrder } }
      : { [sortBy]: sortOrder };

    const rows = await prisma.product.findMany({
      where: {
        ...(keyword && { productName: { contains: keyword, mode: 'insensitive' } }),
        ...(category && { category: { categoryName: category } }),
        ...(categoryId && { categoryId }),
        ...(brand && { brand }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...((minPrice !== undefined || maxPrice !== undefined) && {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }),
      },
      orderBy,
      include: INCLUDE,
    });
    return rows.map(flatten);
  },

    async create({
    supplierId, categoryId = null, productName, brand, size, color, material,
    price, stockQuantity = 0, isActive = true, imageUrl,
  }) {
    return flatten(await prisma.product.create({
      data: {
        supplierId, categoryId, productName, brand, size, color, material,
        price, stockQuantity, isActive, imageUrl,
      },
      include: INCLUDE,
    }));
  },

  async update(productId, data) {
    return flatten(await prisma.product.update({ where: { productId }, data, include: INCLUDE }));
  },

  async setActive(productId, isActive) {
    return flatten(await prisma.product.update({
      where: { productId }, data: { isActive }, include: INCLUDE,
    }));
  },

  remove(productId) {
    return prisma.product.delete({ where: { productId } });
  },
};

export default productRepository;