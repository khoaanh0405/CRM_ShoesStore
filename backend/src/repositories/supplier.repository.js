import prisma from '../config/database.js';

const ALIVE = { isDeleted: false };
const COUNT = { _count: { select: { products: true } } };

export const supplierRepository = {
  findAll() {
    return prisma.supplier.findMany({ where: ALIVE, orderBy: { supplierId: 'asc' }, include: COUNT });
  },
  findById(supplierId) {
    return prisma.supplier.findFirst({ where: { supplierId, ...ALIVE } });
  },
  searchByName(keyword) {
    return prisma.supplier.findMany({
      where: { ...ALIVE, supplierName: { contains: keyword, mode: 'insensitive' } },
      orderBy: { supplierName: 'asc' },
      include: COUNT,
    });
  },
  findByNameExact(supplierName) {
    return prisma.supplier.findFirst({
      where: { ...ALIVE, supplierName: { equals: supplierName, mode: 'insensitive' } },
    });
  },
  findByIdWithProducts(supplierId) {
    return prisma.supplier.findFirst({ where: { supplierId, ...ALIVE }, include: { products: true } });
  },
  countProducts(supplierId) {
    return prisma.product.count({ where: { supplierId } });
  },
  create({ supplierName, phone, email, address }) {
    return prisma.supplier.create({ data: { supplierName, phone, email, address } });
  },
  update(supplierId, { supplierName, phone, email, address }) {
    return prisma.supplier.update({ where: { supplierId }, data: { supplierName, phone, email, address } });
  },
  /** XÓA MỀM */
  remove(supplierId) {
    return prisma.supplier.update({
      where: { supplierId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },
};

export default supplierRepository;