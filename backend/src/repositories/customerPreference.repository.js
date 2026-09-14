/**
 * Repository cho model CustomerPreference (bảng customer_preferences).
 * customer_id -> customers (CASCADE) — không có bảng con nào tham chiếu tới
 * preference_id nên remove() luôn an toàn, không bị FK chặn.
 */
import prisma from '../config/database.js';

export const customerPreferenceRepository = {
  findAll() {
    return prisma.customerPreference.findMany({ orderBy: { preferenceId: 'asc' } });
  },

  findById(preferenceId) {
    return prisma.customerPreference.findUnique({ where: { preferenceId } });
  },

  findByCustomerId(customerId) {
    return prisma.customerPreference.findMany({ where: { customerId } });
  },

  create({ customerId, preferenceTag }) {
    return prisma.customerPreference.create({
      data: { customerId, preferenceTag },
    });
  },

  update(preferenceId, { preferenceTag }) {
    return prisma.customerPreference.update({
      where: { preferenceId },
      data: { preferenceTag },
    });
  },

  remove(preferenceId) {
    return prisma.customerPreference.delete({ where: { preferenceId } });
  },

  /** Thống kê tỷ lệ sở thích khách hàng (mục 4.1.5). */
  countByTag() {
    return prisma.customerPreference.groupBy({
      by: ['preferenceTag'],
      _count: { _all: true },
    });
  },
};

export default customerPreferenceRepository;
