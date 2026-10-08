/**
 * Controller cho Account (đăng ký/đăng nhập/khóa tài khoản/phân quyền/
 * Admin thêm khách hàng/Admin thêm tài khoản nội bộ/quên mật khẩu bằng OTP qua email).
 */
import { accountService } from '../services/index.js';
import { parseId, parseNumber, signToken } from '../utils/index.js';
import { OTP_TTL_MINUTES, OTP_RESEND_SECONDS } from '../constants/index.js';

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
    const { username, password, fullName, email, dateOfBirth, gender, phone, address } = req.body;
    const account = await accountService.registerCustomer({
      username, password, fullName, email, dateOfBirth, gender, phone, address,
    });
    res.status(201).json(account);
  },

  /**
   * Admin thêm một khách hàng mới (mục 4.1.1) — POST /api/admin/customers.
   * `password` trong body là mật khẩu KHỞI TẠO do Admin tự nhập cho khách hàng.
   */
  async createCustomerByAdmin(req, res) {
    const { username, password, fullName, email, dateOfBirth, gender, phone, address } = req.body;
    const account = await accountService.createCustomerByAdmin({
      username, password, fullName, email, dateOfBirth, gender, phone, address,
    });
    res.status(201).json(account);
  },

  /**
   * Admin thêm tài khoản nội bộ (Admin/Manager) — POST /api/admin/staff.
   * Body: { username, email, password, roleName }.
   */
  async createStaff(req, res) {
    const { username, email, password, roleName } = req.body;
    const account = await accountService.createStaff({ username, email, password, roleName });
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

  /** POST /api/accounts/forgot-password — body { email }. Luôn trả cùng 1 thông báo (không lộ email nào đã đăng ký). */
  async forgotPassword(req, res) {
    await accountService.requestPasswordReset(req.body.email);
    res.json({
      message: `Nếu email đã đăng ký, mã OTP đã được gửi tới hộp thư của bạn. Mã có hiệu lực ${OTP_TTL_MINUTES} phút.`,
      resendAfterSeconds: OTP_RESEND_SECONDS,
    });
  },

  /** POST /api/accounts/verify-otp — body { email, otp }. Đúng mã thì 200, frontend mới cho nhập mật khẩu mới. */
  async verifyOtp(req, res) {
    const { email, otp } = req.body;
    await accountService.verifyPasswordResetOtp({ email, otp });
    res.json({ message: 'Mã OTP hợp lệ.' });
  },

  /** POST /api/accounts/reset-password — body { email, otp, newPassword }. */
  async resetPassword(req, res) {
    const { email, otp, newPassword } = req.body;
    await accountService.resetPassword({ email, otp, newPassword });
    res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' });
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
