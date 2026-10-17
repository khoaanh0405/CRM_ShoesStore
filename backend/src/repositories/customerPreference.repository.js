/**
 * Repository cho model CustomerPreference (bảng customer_preferences).
 * Sở thích của khách hàng CHỈ được chọn từ danh mục có sẵn nên bảng lưu categoryId (FK -> categories),
 * không còn lưu tên danh mục dạng chuỗi.
 *  - customer_id -> customers (CASCADE), category_id -> categories (CASCADE)
 *  - UNIQUE (customer_id, category_id): một khách hàng không chọn trùng một danh mục.
 * Không có bảng con nào tham chiếu tới preference_id nên remove() luôn an toàn.
 */
import prisma from '../config/database.js';

const WITH_CATEGORY = {
  category: { select: { categoryId: true, categoryName: true, description: true, isDeleted: true } },
};

export const customerPreferenceRepository = {
  findAll() {
    return prisma.customerPreference.findMany({ orderBy: { preferenceId: 'asc' }, include: WITH_CATEGORY });
  },

  findById(preferenceId) {
    return prisma.customerPreference.findUnique({ where: { preferenceId }, include: WITH_CATEGORY });
  },

  /** Chỉ trả sở thích thuộc danh mục chưa bị xóa mềm. */
  findByCustomerId(customerId) {
    return prisma.customerPreference.findMany({
      where: { customerId, category: { isDeleted: false } },
      orderBy: { preferenceId: 'asc' },
      include: WITH_CATEGORY,
    });
  },

  findByCustomerAndCategory(customerId, categoryId) {
    return prisma.customerPreference.findUnique({
      where: { uq_customer_preference_category: { customerId, categoryId } },
    });
  },

  create({ customerId, categoryId }) {
    return prisma.customerPreference.create({
      data: { customerId, categoryId },
      include: WITH_CATEGORY,
    });
  },

  update(preferenceId, { categoryId }) {
    return prisma.customerPreference.update({
      where: { preferenceId },
      data: { categoryId },
      include: WITH_CATEGORY,
    });
  },

  remove(preferenceId) {
    return prisma.customerPreference.delete({ where: { preferenceId } });
  },

  /** Thống kê tỷ lệ sở thích khách hàng (mục 4.1.5): đếm số khách hàng theo từng danh mục. */
  async countByCategory({ activeCustomersOnly = true } = {}) {
    const groups = await prisma.customerPreference.groupBy({
      by: ['categoryId'],
      where: {
        category: { isDeleted: false },
        ...(activeCustomersOnly && { customer: { isDeleted: false } }),
      },
      _count: { _all: true },
    });
    if (groups.length === 0) return [];
    const categories = await prisma.category.findMany({
      where: { categoryId: { in: groups.map((g) => g.categoryId) } },
      select: { categoryId: true, categoryName: true },
    });
    const nameOf = new Map(categories.map((c) => [c.categoryId, c.categoryName]));
    return groups
      .map((g) => ({ categoryId: g.categoryId, categoryName: nameOf.get(g.categoryId) ?? `#${g.categoryId}`, count: g._count._all }))
      .sort((a, b) => b.count - a.count);
  },
};

export default customerPreferenceRepository;
