/**
 * Controller cho Account (đăng ký/đăng nhập/khóa tài khoản/phân quyền/
 * Admin thêm khách hàng).
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
   * Admin thêm một khách hàng mới (mục 4.1.1) — POST /api/admin/customers.
   * Route gắn adminOnly (xem admin.routes.js) nên chỉ Admin gọi được; khác
   * register() ở chỗ người gọi là Admin (không phải khách hàng tự đăng ký)
   * và `password` trong body là mật khẩu KHỞI TẠO do Admin tự nhập cho
   * khách hàng, không phải khách hàng tự đặt.
   */
  async createCustomerByAdmin(req, res) {
    const { username, password, fullName, dateOfBirth, gender, phone, address } = req.body;
    const account = await accountService.createCustomerByAdmin({
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

  /**
   * Body: { roleName } — khớp với AccountManagement.tsx (gửi roleName, không
   * phải roleId). accountService.updateRole tự tra roleId tương ứng.
   */
  async updateRole(req, res) {
    const accountId = parseId(req.params.id, 'accountId');
    const { roleName } = req.body;
    res.json(await accountService.updateRole(accountId, roleName));
  },
};

export default accountController;