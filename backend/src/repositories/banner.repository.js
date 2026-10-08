import prisma from '../config/database.js';

const ORDER = [{ sortOrder: 'asc' }, { bannerId: 'asc' }];

export const bannerRepository = {
  findActive() {
    return prisma.banner.findMany({ where: { isActive: true }, orderBy: ORDER });
  },
  findAll() {
    return prisma.banner.findMany({ orderBy: ORDER });
  },
  findById(bannerId) {
    return prisma.banner.findUnique({ where: { bannerId } });
  },
  create(data) {
    return prisma.banner.create({ data });
  },
  update(bannerId, data) {
    return prisma.banner.update({ where: { bannerId }, data });
  },
  remove(bannerId) {
    return prisma.banner.delete({ where: { bannerId } });
  },
};

export default bannerRepository;