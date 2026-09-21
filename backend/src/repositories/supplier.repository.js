/**
 * Repository cho model Supplier (bảng suppliers).
 * products.supplier_id -> suppliers (RESTRICT): remove() sẽ throw lỗi Prisma
 * (P2003) nếu supplier còn sản phẩm liên kết — Service layer bắt và xử lý.
 */
import prisma from '../config/database.js';

export const supplierRepository = {
  findAll() {
    return prisma.supplier.findMany({ orderBy: { supplierId: 'asc' } });
  },

  findById(supplierId) {
    return prisma.supplier.findUnique({ where: { supplierId } });
  },

  /** Admin "tìm kiếm nâng cao" nhà cung cấp theo tên. */
  searchByName(keyword) {
    return prisma.supplier.findMany({
      where: { supplierName: { contains: keyword, mode: 'insensitive' } },
      orderBy: { supplierName: 'asc' },
    });
  },

  findByNameExact(supplierName) {
    return prisma.supplier.findFirst({
      where: { supplierName: { equals: supplierName, mode: 'insensitive' } },
    });
  },

  findByIdWithProducts(supplierId) {
    return prisma.supplier.findUnique({
      where: { supplierId },
      include: { products: true },
    });
  },

  create({ supplierName, phone, email, address }) {
    return prisma.supplier.create({
      data: { supplierName, phone, email, address },
    });
  },

  update(supplierId, { supplierName, phone, email, address }) {
    return prisma.supplier.update({
      where: { supplierId },
      data: { supplierName, phone, email, address },
    });
  },

  remove(supplierId) {
    return prisma.supplier.delete({ where: { supplierId } });
  },
};

export default supplierRepository;
