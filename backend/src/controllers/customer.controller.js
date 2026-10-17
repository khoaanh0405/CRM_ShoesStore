/**
 * Controller cho Customer. DELETE /api/customers/:id = SOFT DELETE, ghi AuditLog.
 */
import { customerService } from '../services/index.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId, parseBoolean } from '../utils/index.js';
import { buildFullName } from '../utils/name.util.js';

export const customerController = {
  async list(req, res) {
    res.json(await customerService.list({ includeDeleted: parseBoolean(req.query.includeDeleted) ?? false }));
  },
  async report(req, res) {
    res.json(await customerService.report());
  },
  async search(req, res) {
    const { keyword, gender } = req.query;
    res.json(await customerService.search({ keyword, gender, includeDeleted: parseBoolean(req.query.includeDeleted) ?? false }));
  },
  async getById(req, res) {
    const customerId = parseId(req.params.id, 'customerId');
    res.json(await customerService.getById(customerId, { includeDeleted: parseBoolean(req.query.includeDeleted) ?? false }));
  },
  async getProfile(req, res) {
    res.json(await customerService.getProfile(parseId(req.params.id, 'customerId')));
  },
  async updateProfile(req, res) {
    const customerId = parseId(req.params.id, 'customerId');
    const { firstName, lastName, dateOfBirth, gender, phone, email, address } = req.body;
    res.json(await customerService.updateProfile(
      customerId, { firstName, lastName, dateOfBirth, gender, phone, email, address }, req.user?.customerId
    ));
  },
  async remove(req, res) {
    const customerId = parseId(req.params.id, 'customerId');
    const result = await customerService.remove(customerId);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.DELETE_CUSTOMER, entityType: AUDIT_ENTITY.CUSTOMER, entityId: customerId,
      description: `Xóa khách hàng "${buildFullName(result)}" (xóa mềm)`,
    });
    res.json(result);
  },
};

export default customerController;
