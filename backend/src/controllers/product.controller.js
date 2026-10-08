import { productService } from '../services/index.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId, parseBoolean, parseNumber } from '../utils/index.js';

export const productController = {
  async list(req, res) {
    const includeInactive = parseBoolean(req.query.includeInactive) ?? false;
    res.json(await productService.list({ includeInactive }));
  },

  /** Query: keyword, category (tên), categoryId, brand, minPrice, maxPrice, isActive, sortBy, sortOrder. */
  async search(req, res) {
    const { keyword, category, brand, sortBy, sortOrder } = req.query;
    res.json(await productService.search({
      keyword, category, brand, sortBy, sortOrder,
      categoryId: parseNumber(req.query.categoryId),
      minPrice: parseNumber(req.query.minPrice),
      maxPrice: parseNumber(req.query.maxPrice),
      isActive: parseBoolean(req.query.isActive),
    }));
  },

  async getById(req, res) {
    res.json(await productService.getById(parseId(req.params.id, 'productId')));
  },

  async listBySupplier(req, res) {
    res.json(await productService.listBySupplier(parseId(req.params.supplierId, 'supplierId')));
  },

  async create(req, res) {
    const product = await productService.create(req.body);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CREATE_PRODUCT, entityType: AUDIT_ENTITY.PRODUCT, entityId: product.productId,
      description: `Thêm sản phẩm "${product.productName}"`,
    });
    res.status(201).json(product);
  },

  async update(req, res) {
    const productId = parseId(req.params.id, 'productId');
    const product = await productService.update(productId, req.body);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.UPDATE_PRODUCT, entityType: AUDIT_ENTITY.PRODUCT, entityId: productId,
      description: `Cập nhật sản phẩm "${product.productName}"`,
    });
    res.json(product);
  },

  async setActive(req, res) {
    const productId = parseId(req.params.id, 'productId');
    const isActive = parseBoolean(req.body.isActive);
    const product = await productService.setActive(productId, isActive);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.TOGGLE_PRODUCT, entityType: AUDIT_ENTITY.PRODUCT, entityId: productId,
      description: `${isActive ? 'Hiện' : 'Ẩn'} sản phẩm "${product.productName}"`,
    });
    res.json(product);
  },

  async remove(req, res) {
    const productId = parseId(req.params.id, 'productId');
    const product = await productService.setActive(productId, false);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.TOGGLE_PRODUCT, entityType: AUDIT_ENTITY.PRODUCT, entityId: productId,
      description: `Ẩn sản phẩm "${product.productName}"`,
    });
    res.status(204).send();
  },
};

export default productController;