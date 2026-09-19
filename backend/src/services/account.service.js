/**
 * Service cho Account — nơi duy nhất được phép hash/so khớp mật khẩu (đúng
 * ghi chú "Repository không chịu trách nhiệm hash mật khẩu" trong
 * account.repository.js).
 *
 * registerCustomer() và createCustomerByAdmin() cần tạo đồng thời Account
 * (role Customer) + Customer trong 1 transaction — đúng gợi ý trong
 * customer.repository.js ("dùng prisma.account.create({ data: { ...,
 * customer: { create: {...} } } })") vì Repository layer không hỗ trợ
 * nested-write/transaction giữa 2 bảng. Cả 2 luồng dùng chung 1 hàm private
 * createAccountWithNewCustomer() vì nghiệp vụ tạo Account+Customer giống hệt
 * nhau — điểm khác nhau duy nhất là AI được phép gọi (route/middleware quyết
 * định: register công khai, createCustomerByAdmin chỉ Admin qua adminOnly).
 */
import prisma from '../config/database.js';
import { accountRepository, roleRepository } from '../repositories/index.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '../errors/AppError.js';
import { ROLE_NAMES, MESSAGES, MIN_PASSWORD_LENGTH } from '../constants/index.js';
import { hashPassword, comparePassword } from '../utils/index.js';

/** Không bao giờ trả passwordHash ra ngoài Service/Controller. */
function sanitize(account) {
  if (!account) return account;
  const { passwordHash, ...rest } = account;
  return rest;
}

/**
 * Tạo đồng thời 1 Account (role Customer, isLocked=false) + 1 Customer
 * trong cùng 1 nested-write. Dùng chung cho:
 *  - registerCustomer (mục 4.3.1 — khách hàng TỰ đăng ký, mật khẩu do
 *    chính khách hàng nhập)
 *  - createCustomerByAdmin (mục 4.1.1 — Admin THÊM khách hàng hộ, mật khẩu
 *    khởi tạo do Admin nhập qua field `password`)
 * Ai được phép gọi hàm này là quyết định của route/middleware (accounts
 * routes để /register công khai; admin routes gắn adminOnly), bản thân
 * Service không phân biệt "ai đang tạo" vì nghiệp vụ tạo bản ghi là như
 * nhau — tránh lặp lại y hệt logic validate + nested-write ở 2 nơi.
 */
async function createAccountWithNewCustomer({
  username,
  password,
  fullName,
  dateOfBirth,
  gender,
  phone,
  address,
}) {
  if (!username?.trim() || !password || !fullName?.trim() || !dateOfBirth) {
    throw new ValidationError('Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, họ tên và ngày sinh.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
  }

  const existed = await accountRepository.findByUsername(username.trim());
  if (existed) throw new ConflictError(`Tên đăng nhập "${username}" đã tồn tại.`);

  const customerRole = await roleRepository.findByName(ROLE_NAMES.CUSTOMER);
  if (!customerRole) throw new NotFoundError(`Hệ thống chưa cấu hình vai trò "${ROLE_NAMES.CUSTOMER}".`);

  const passwordHash = await hashPassword(password);

  const account = await prisma.account.create({
    data: {
      username: username.trim(),
      passwordHash,
      roleId: customerRole.roleId,
      isLocked: false,
      customer: {
        create: {
          fullName: fullName.trim(),
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phone,
          address,
        },
      },
    },
    include: { role: true, customer: true },
  });

  return sanitize(account);
}

export const accountService = {
  async list({ roleId } = {}) {
    const accounts = await accountRepository.findAll({ roleId });
    return accounts.map(sanitize);
  },

  async getById(accountId) {
    const account = await accountRepository.findById(accountId);
    if (!account) throw new NotFoundError(MESSAGES.NOT_FOUND.ACCOUNT);
    return sanitize(account);
  },

  /** Khách hàng tự đăng ký tài khoản (mục 4.3.1). */
  registerCustomer(payload) {
    return createAccountWithNewCustomer(payload);
  },

  /**
   * Admin thêm một khách hàng mới (mục 4.1.1) — nghiệp vụ tách biệt khỏi
   * registerCustomer ở tầng route (chỉ Admin gọi được qua adminOnly), còn
   * việc tạo Account+Customer dùng chung createAccountWithNewCustomer().
   * `password` ở đây LÀ mật khẩu khởi tạo do Admin tự nhập cho khách hàng
   * (không phải khách hàng tự đặt) — khách hàng có thể đổi lại sau qua
   * PATCH /accounts/:id/password.
   */
  createCustomerByAdmin(payload) {
    return createAccountWithNewCustomer(payload);
  },

  /**
   * Service chỉ XÁC THỰC và trả account (đã bỏ passwordHash). Controller là
   * nơi phát hành JWT — payload chỉ chứa thứ cần cho phân quyền, đúng như
   * middleware auth.middleware.js mong đợi (accountId, roleName, customerId).
   */
  async login({ username, password }) {
    if (!username || !password) {
      throw new ValidationError('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }

    const account = await accountRepository.findByUsernameWithRelations(username.trim());
    if (!account) throw new UnauthorizedError();

    const isMatch = await comparePassword(password, account.passwordHash);
    if (!isMatch) throw new UnauthorizedError();

    if (account.isLocked) {
      throw new UnauthorizedError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
    }

    if (account.customer?.isDeleted) {
      throw new UnauthorizedError('Tài khoản khách hàng không còn tồn tại.');
    }

    return sanitize(account);
  },

  /** Khách hàng/Admin tự đổi mật khẩu — luôn yêu cầu đúng mật khẩu cũ. */
  async changePassword(accountId, { oldPassword, newPassword }) {
    const account = await prisma.account.findUnique({ where: { accountId } });
    if (!account) throw new NotFoundError(MESSAGES.NOT_FOUND.ACCOUNT);

    const isMatch = await comparePassword(oldPassword ?? '', account.passwordHash);
    if (!isMatch) throw new UnauthorizedError('Mật khẩu cũ không đúng.');

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
    }

    const passwordHash = await hashPassword(newPassword);
    return sanitize(await accountRepository.update(accountId, { passwordHash }));
  },

  /** Khóa tài khoản khách hàng (mục 4.1.3), cũng dùng chung để Admin khóa account bất kỳ. */
  async lock(accountId) {
    await this.getById(accountId);
    return sanitize(await accountRepository.lock(accountId));
  },

  async unlock(accountId) {
    await this.getById(accountId);
    return sanitize(await accountRepository.unlock(accountId));
  },

  /** Admin phân quyền lại cho account. */
  async updateRole(accountId, roleId) {
    await this.getById(accountId);
    const role = await roleRepository.findById(roleId);
    if (!role) throw new NotFoundError(MESSAGES.NOT_FOUND.ROLE);
    return sanitize(await accountRepository.updateRole(accountId, roleId));
  },
};

export default accountService;