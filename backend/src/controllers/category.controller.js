import { categoryService } from '../services/category.service.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId } from '../utils/index.js';

export const categoryController = {
  async list(req, res) {
    res.json(await categoryService.list());
  },

  async create(req, res) {
    const { categoryName, description } = req.body;
    const c = await categoryService.create({ categoryName, description });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CREATE_CATEGORY, entityType: AUDIT_ENTITY.CATEGORY, entityId: c.categoryId,
      description: `Thêm danh mục "${c.categoryName}"`,
    });
    res.status(201).json(c);
  },

  async update(req, res) {
    const id = parseId(req.params.id, 'categoryId');
    const { categoryName, description } = req.body;
    const c = await categoryService.update(id, { categoryName, description });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.UPDATE_CATEGORY, entityType: AUDIT_ENTITY.CATEGORY, entityId: id,
      description: `Cập nhật danh mục "${c.categoryName}"`,
    });
    res.json(c);
  },

  async remove(req, res) {
    const id = parseId(req.params.id, 'categoryId');
    const c = await categoryService.remove(id);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.DELETE_CATEGORY, entityType: AUDIT_ENTITY.CATEGORY, entityId: id,
      description: `Xóa danh mục "${c.categoryName}"`,
    });
    res.status(204).send();
  },
};

export default categoryController;