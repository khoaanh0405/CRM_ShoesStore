/**
 * Service cho Account — nơi duy nhất được phép hash/so khớp mật khẩu (đúng
 * ghi chú "Repository không chịu trách nhiệm hash mật khẩu" trong
 * account.repository.js).
 *
 * registerCustomer() cần tạo đồng thời Account (role Customer) + Customer
 * trong 1 transaction — đúng gợi ý trong customer.repository.js
 * ("dùng prisma.account.create({ data: { ..., customer: { create: {...} } } })")
 * vì Repository layer không hỗ trợ nested-write/transaction giữa 2 bảng.
 */
import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { accountRepository, roleRepository } from '../repositories/index.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '../errors/AppError.js';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

/** Không bao giờ trả passwordHash ra ngoài Service/Controller. */
function sanitize(account) {
  if (!account) return account;
  const { passwordHash, ...rest } = account;
  return rest;
}

export const accountService = {
  async list({ roleId } = {}) {
    const accounts = await accountRepository.findAll({ roleId });
    return accounts.map(sanitize);
  },

  async getById(accountId) {
    const account = await accountRepository.findById(accountId);
    if (!account) throw new NotFoundError('Không tìm thấy tài khoản.');
    return sanitize(account);
  },

  /** Khách hàng tự đăng ký tài khoản (mục 4.3.1). */
  async registerCustomer({ username, password, fullName, dateOfBirth, gender, phone, address }) {
    if (!username?.trim() || !password || !fullName?.trim() || !dateOfBirth) {
      throw new ValidationError('Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, họ tên và ngày sinh.');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
    }

    const existed = await accountRepository.findByUsername(username.trim());
    if (existed) throw new ConflictError(`Tên đăng nhập "${username}" đã tồn tại.`);

    const customerRole = await roleRepository.findByName('Customer');
    if (!customerRole) throw new NotFoundError('Hệ thống chưa cấu hình vai trò "Customer".');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

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
  },

  /**
   * Đăng nhập dùng chung cho Admin & Customer. Chặn nếu: sai mật khẩu, tài
   * khoản đang khóa, hoặc (với Customer) hồ sơ đã bị soft-delete. Việc phát
   * hành JWT/session để tầng Controller đảm nhiệm — Service chỉ xác thực.
   */
  async login({ username, password }) {
    if (!username || !password) {
      throw new ValidationError('Vui lòng nhập tên đăng nhập và mật khẩu.');
    }

    const account = await accountRepository.findByUsernameWithRelations(username.trim());
    if (!account) throw new UnauthorizedError();

    const isMatch = await bcrypt.compare(password, account.passwordHash);
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
    if (!account) throw new NotFoundError('Không tìm thấy tài khoản.');

    const isMatch = await bcrypt.compare(oldPassword ?? '', account.passwordHash);
    if (!isMatch) throw new UnauthorizedError('Mật khẩu cũ không đúng.');

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
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
    if (!role) throw new NotFoundError('Không tìm thấy vai trò.');
    return sanitize(await accountRepository.updateRole(accountId, roleId));
  },
};

export default accountService;
