import prisma from '../config/database.js';

export const categoryRepository = {
  findAll() {
    return prisma.category.findMany({
      orderBy: { categoryName: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  },
  findById(categoryId) {
    return prisma.category.findUnique({ where: { categoryId } });
  },
  findByNameExact(categoryName) {
    return prisma.category.findFirst({
      where: { categoryName: { equals: categoryName, mode: 'insensitive' } },
    });
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
  remove(categoryId) {
    return prisma.category.delete({ where: { categoryId } });
  },
};

export default categoryRepository;