/**
 * Controller cho Account (đăng ký/đăng nhập/khóa tài khoản/phân quyền/
 * Admin thêm khách hàng/Admin thêm tài khoản nội bộ).
 */
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { accountService } from '../services/index.js';
import { parseId, parseNumber, signToken } from '../utils/index.js';
import { buildFullName } from '../utils/name.util.js';

export const accountController = {
  async list(req, res) {
    const roleId = parseNumber(req.query.roleId);
    res.json(await accountService.list({ roleId }));
  },

  async getById(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    res.json(await accountService.getById(accountId));
  },

  /** Thông tin tài khoản đang đăng nhập. Đi qua authenticate nên tài khoản bị khóa sẽ nhận 401 ACCOUNT_LOCKED. */
  async me(req, res) {
    res.json(await accountService.getById(req.user.accountId));
  },

  /** Khách hàng tự đăng ký — tạo Account + Customer trong 1 transaction. */
  async register(req, res) {
    const { username, password, lastName, firstName, email, dateOfBirth, gender, phone, address } = req.body;
    const account = await accountService.registerCustomer({
      username, password, lastName, firstName, email, dateOfBirth, gender, phone, address,
    });
    res.status(201).json(account);
  },

  /**
   * Admin thêm một khách hàng mới (mục 4.1.1) — POST /api/admin/customers.
   * `password` trong body là mật khẩu KHỞI TẠO do Admin tự nhập cho khách hàng.
   */
  async createCustomerByAdmin(req, res) {
    const { username, password, lastName, firstName, email, dateOfBirth, gender, phone, address } = req.body;
    const account = await accountService.createCustomerByAdmin({
      username, password, lastName, firstName, email, dateOfBirth, gender, phone, address,
    });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CREATE_CUSTOMER, entityType: AUDIT_ENTITY.CUSTOMER, entityId: account.accountId,
      description: `Thêm khách hàng "${buildFullName({ lastName, firstName })}" (tài khoản ${username})`,
    });
    res.status(201).json(account);
  },

  async createStaff(req, res) {
    const { username, lastName, firstName, email, password, roleName, dateOfBirth, gender, phone, address, position } = req.body;
    const account = await accountService.createStaff({
      username, lastName, firstName, email, password, roleName, dateOfBirth, gender, phone, address, position,
    });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CREATE_STAFF, entityType: AUDIT_ENTITY.ACCOUNT, entityId: account.accountId,
      description: `Tạo tài khoản ${roleName} "${username}" (${buildFullName({ lastName, firstName })})`,
    });
    res.status(201).json(account);
  },

  /**
   * Service chỉ XÁC THỰC và trả account (đã bỏ passwordHash). Controller là
   * nơi phát hành JWT — payload chỉ chứa thứ cần cho phân quyền, đúng như
   * middleware auth.middleware.js mong đợi (accountId, roleName, customerId, employeeId).
   */
  async login(req, res) {
    const { username, password } = req.body;
    const account = await accountService.login({ username, password });

    const token = signToken({
      accountId: account.accountId,
      username: account.username,
      roleName: account.role?.roleName,
      customerId: account.customer?.customerId,
      employeeId: account.employee?.employeeId,
    });

    res.json({ token, account });
  },

  async changePassword(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    const { oldPassword, newPassword } = req.body;
    res.json(await accountService.changePassword(accountId, { oldPassword, newPassword }));
  },

  async lock(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    const account = await accountService.lock(accountId);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.LOCK_ACCOUNT, entityType: AUDIT_ENTITY.ACCOUNT, entityId: accountId,
      description: `Khóa tài khoản "${account.username}"`,
    });
    res.json(account);
  },

  async unlock(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    const account = await accountService.unlock(accountId);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.UNLOCK_ACCOUNT, entityType: AUDIT_ENTITY.ACCOUNT, entityId: accountId,
      description: `Mở khóa tài khoản "${account.username}"`,
    });
    res.json(account);
  },

  async updateRole(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    const { roleName } = req.body;
    const account = await accountService.updateRole(accountId, roleName);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CHANGE_ROLE, entityType: AUDIT_ENTITY.ACCOUNT, entityId: accountId,
      description: `Đổi vai trò tài khoản "${account.username}" thành ${roleName}`,
    });
    res.json(account);
  },
};

export default accountController;
