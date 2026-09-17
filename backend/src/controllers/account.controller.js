/**
 * Controller cho Account (đăng ký/đăng nhập/khóa tài khoản/phân quyền).
 * Lưu ý: accountService.login() chỉ XÁC THỰC và trả về account (đã bỏ
 * passwordHash) — việc phát hành JWT là của tầng Controller/middleware auth,
 * hiện chưa triển khai nên ở đây chỉ trả account về cho client.
 */
import { accountService } from '../services/index.js';
import { parseId, parseNumber, signToken } from '../utils/index.js';

export const accountController = {
  async list(req, res) {
    const roleId = parseNumber(req.query.roleId);
    res.json(await accountService.list({ roleId }));
  },

  async getById(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    res.json(await accountService.getById(accountId));
  },

  /** Khách hàng tự đăng ký — tạo Account + Customer trong 1 transaction. */
  async register(req, res) {
    const { username, password, fullName, dateOfBirth, gender, phone, address } = req.body;
    const account = await accountService.registerCustomer({
      username, password, fullName, dateOfBirth, gender, phone, address,
    });
    res.status(201).json(account);
  },

  /**
   * Service chỉ XÁC THỰC và trả account (đã bỏ passwordHash). Controller là
   * nơi phát hành JWT — payload chỉ chứa thứ cần cho phân quyền, đúng như
   * middleware auth.middleware.js mong đợi (accountId, roleName, customerId).
   */
  async login(req, res) {
    const { username, password } = req.body;
    const account = await accountService.login({ username, password });

    const token = signToken({
      accountId: account.accountId,
      username: account.username,
      roleName: account.role?.roleName,
      customerId: account.customer?.customerId,
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
    res.json(await accountService.lock(accountId));
  },

  async unlock(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    res.json(await accountService.unlock(accountId));
  },

  async updateRole(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    const roleId = parseId(req.body.roleId, 'roleId');
    res.json(await accountService.updateRole(accountId, roleId));
  },
};

export default accountController;
