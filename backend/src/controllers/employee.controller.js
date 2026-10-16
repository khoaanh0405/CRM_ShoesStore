import { employeeService } from '../services/index.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';

export const employeeController = {
  /** GET /api/employees — Admin xem danh sách nhân sự. */
  async list(req, res) {
    res.json(await employeeService.list());
  },

  /** GET /api/employees/me — hồ sơ của nhân sự đang đăng nhập. */
  async getMe(req, res) {
    res.json(await employeeService.getMe(req.user.accountId));
  },

  /** PUT /api/employees/me — nhân sự tự sửa thông tin của mình. */
  async updateMe(req, res) {
    const { fullName, dateOfBirth, gender, phone, email, address } = req.body;
    const profile = await employeeService.updateMe(req.user.accountId, { fullName, dateOfBirth, gender, phone, email, address });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.UPDATE_PROFILE, entityType: AUDIT_ENTITY.EMPLOYEE, entityId: req.user.accountId,
      description: `Cập nhật hồ sơ cá nhân của "${profile.username}"`,
    });
    res.json(profile);
  },
};

export default employeeController;
