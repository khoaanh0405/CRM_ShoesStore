import { supplierService } from '../services/index.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId } from '../utils/index.js';

export const supplierController = {
  async list(req, res) {
    res.json(await supplierService.list());
  },

  async search(req, res) {
    res.json(await supplierService.search(req.query.keyword));
  },

  async getById(req, res) {
    res.json(await supplierService.getById(parseId(req.params.id, 'supplierId')));
  },

  async getWithProducts(req, res) {
    res.json(await supplierService.getWithProducts(parseId(req.params.id, 'supplierId')));
  },

  async create(req, res) {
    const { supplierName, phone, email, address } = req.body;
    const supplier = await supplierService.create({ supplierName, phone, email, address });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CREATE_SUPPLIER, entityType: AUDIT_ENTITY.SUPPLIER, entityId: supplier.supplierId,
      description: `Thêm nhà cung cấp "${supplier.supplierName}"`,
    });
    res.status(201).json(supplier);
  },

  async update(req, res) {
    const supplierId = parseId(req.params.id, 'supplierId');
    const { supplierName, phone, email, address } = req.body;
    const supplier = await supplierService.update(supplierId, { supplierName, phone, email, address });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.UPDATE_SUPPLIER, entityType: AUDIT_ENTITY.SUPPLIER, entityId: supplierId,
      description: `Cập nhật nhà cung cấp "${supplier.supplierName}"`,
    });
    res.json(supplier);
  },

  async remove(req, res) {
    const supplierId = parseId(req.params.id, 'supplierId');
    const supplier = await supplierService.remove(supplierId);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.DELETE_SUPPLIER, entityType: AUDIT_ENTITY.SUPPLIER, entityId: supplierId,
      description: `Xóa nhà cung cấp "${supplier.supplierName}"`,
    });
    res.status(204).send();
  },
};

export default supplierController;