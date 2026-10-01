import { supplierRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { MESSAGES } from '../constants/index.js';
import { isForeignKeyError } from '../utils/index.js';

export const supplierService = {
  list() {
    return supplierRepository.findAll();
  },

  async getById(supplierId) {
    const supplier = await supplierRepository.findById(supplierId);
    if (!supplier) throw new NotFoundError(MESSAGES.NOT_FOUND.SUPPLIER);
    return supplier;
  },

  /** Admin "tìm kiếm nâng cao" nhà cung cấp (mục II.2). */
  search(keyword) {
    if (!keyword?.trim()) return supplierRepository.findAll();
    return supplierRepository.searchByName(keyword.trim());
  },

  getWithProducts(supplierId) {
    return this.getById(supplierId).then(() => supplierRepository.findByIdWithProducts(supplierId));
  },

  async create({ supplierName, phone, email, address }) {
    if (!supplierName?.trim()) throw new ValidationError('Tên nhà cung cấp không được để trống.');
    
    const existing = await supplierRepository.findByNameExact(supplierName.trim());
    if (existing) throw new ConflictError('Nhà cung cấp với tên này đã tồn tại.');

    return supplierRepository.create({ supplierName: supplierName.trim(), phone, email, address });
  },

  async update(supplierId, { supplierName, phone, email, address }) {
    await this.getById(supplierId);
    if (supplierName !== undefined) {
      if (!supplierName.trim()) throw new ValidationError('Tên nhà cung cấp không được để trống.');
      const existing = await supplierRepository.findByNameExact(supplierName.trim());
      if (existing && existing.supplierId !== supplierId) {
        throw new ConflictError('Nhà cung cấp với tên này đã tồn tại.');
      }
    }
    return supplierRepository.update(supplierId, {
      supplierName: supplierName?.trim(),
      phone,
      email,
      address,
    });
  },

  /** Xóa cứng — sẽ báo lỗi nghiệp vụ nếu nhà cung cấp còn sản phẩm liên kết. */
  async remove(supplierId) {
    await this.getById(supplierId);
    try {
      return await supplierRepository.remove(supplierId);
    } catch (err) {
      if (isForeignKeyError(err)) {
        throw new ConflictError('Không thể xóa nhà cung cấp vì vẫn còn sản phẩm liên kết.');
      }
      throw err;
    }
  },
};

export default supplierService;
