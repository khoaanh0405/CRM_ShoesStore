import prisma from '../config/database.js';

const ORDER = [{ sortOrder: 'asc' }, { bannerId: 'asc' }];
const ALIVE = { isDeleted: false };

export const bannerRepository = {
  findActive() {
    return prisma.banner.findMany({ where: { ...ALIVE, isActive: true }, orderBy: ORDER });
  },
  findAll() {
    return prisma.banner.findMany({ where: ALIVE, orderBy: ORDER });
  },
  findById(bannerId) {
    return prisma.banner.findFirst({ where: { bannerId, ...ALIVE } });
  },
  create(data) {
    return prisma.banner.create({ data });
  },
  update(bannerId, data) {
    return prisma.banner.update({ where: { bannerId }, data });
  },
  /** XÓA MỀM */
  remove(bannerId) {
    return prisma.banner.update({
      where: { bannerId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },
};

export default bannerRepository;