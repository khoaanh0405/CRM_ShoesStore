import prisma from '../config/database.js';

const ALIVE = { isDeleted: false };

export const categoryRepository = {
  findAll({ onlyWithProducts = false } = {}) {
    return prisma.category.findMany({
      where: { ...ALIVE, ...(onlyWithProducts && { products: { some: { isActive: true } } }) },
      orderBy: { categoryName: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  },
  findById(categoryId) {
    return prisma.category.findFirst({ where: { categoryId, ...ALIVE } });
  },
  findByNameExact(categoryName) {
    return prisma.category.findFirst({ where: { categoryName: { equals: categoryName, mode: 'insensitive' } } });
  },
  countProducts(categoryId) {
    return prisma.product.count({ where: { categoryId } });
  },
  create({ categoryName, description }) {
    return prisma.category.create({ data: { categoryName, description } });
  },
  update(categoryId, { categoryName, description }) {
    return prisma.category.update({ where: { categoryId }, data: { categoryName, description } });
  },
  restore(categoryId, { categoryName, description }) {
    return prisma.category.update({ where: { categoryId }, data: { categoryName, description, isDeleted: false, deletedAt: null } });
  },
  remove(categoryId) {
    return prisma.category.update({ where: { categoryId }, data: { isDeleted: true, deletedAt: new Date() } });
  },
};
export default categoryRepository;
