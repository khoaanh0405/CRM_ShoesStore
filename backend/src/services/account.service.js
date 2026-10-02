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
 *
 * Quên mật khẩu bằng OTP gửi qua email: requestPasswordReset() + resetPassword().
 */
import prisma from '../config/database.js';
import {
  accountRepository,
  roleRepository,
  customerRepository,
  passwordResetOtpRepository,
} from '../repositories/index.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '../errors/AppError.js';
import {
  ROLE_NAMES, MESSAGES,
  OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS, OTP_RESEND_SECONDS,
} from '../constants/index.js';
import {
  hashPassword, comparePassword,
  assertValidEmail, normalizeEmail, assertStrongPassword,
  generateOtp, hashOtp, verifyOtpHash, sendPasswordResetOtpMail,
} from '../utils/index.js';

/** Không bao giờ trả passwordHash ra ngoài Service/Controller. */
function sanitize(account) {
  if (!account) return account;
  const { passwordHash, ...rest } = account;
  return rest;
}

const OTP_INVALID_MESSAGE = 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại hoặc gửi lại mã mới.';

/**
 * Tạo đồng thời 1 Account (role Customer, isLocked=false) + 1 Customer
 * trong cùng 1 nested-write. Dùng chung cho:
 *  - registerCustomer (mục 4.3.1 — khách hàng TỰ đăng ký)
 *  - createCustomerByAdmin (mục 4.1.1 — Admin THÊM khách hàng hộ, mật khẩu
 *    khởi tạo do Admin nhập qua field `password`)
 * Ai được phép gọi hàm này là quyết định của route/middleware.
 */
async function createAccountWithNewCustomer({
  username,
  password,
  fullName,
  email,
  dateOfBirth,
  gender,
  phone,
  address,
}) {
  if (!username?.trim() || !password || !fullName?.trim() || !dateOfBirth) {
    throw new ValidationError('Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, họ tên và ngày sinh.');
  }
  const normalizedEmail = assertValidEmail(email);
  assertStrongPassword(password, username);

  const existed = await accountRepository.findByUsername(username.trim());
  if (existed) throw new ConflictError(`Tên đăng nhập "${username}" đã tồn tại.`);

  const emailOwner = await customerRepository.findByEmail(normalizedEmail);
  if (emailOwner) throw new ConflictError('Email này đã được sử dụng bởi tài khoản khác.');

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
          email: normalizedEmail,
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
   * Admin thêm một khách hàng mới (mục 4.1.1). `password` ở đây LÀ mật khẩu
   * khởi tạo do Admin tự nhập cho khách hàng — khách hàng có thể đổi lại sau.
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

    assertStrongPassword(newPassword, account.username);

    const passwordHash = await hashPassword(newPassword);
    return sanitize(await accountRepository.update(accountId, { passwordHash }));
  },

  /**
   * Quên mật khẩu — bước 1: sinh OTP 6 số, lưu bản băm + hạn dùng vào DB và gửi
   * email. Luôn "im lặng" khi email không tồn tại / tài khoản bị khóa / vừa gửi
   * mã chưa đủ OTP_RESEND_SECONDS để không lộ email nào đã đăng ký.
   */
  async requestPasswordReset(rawEmail) {
    const email = assertValidEmail(rawEmail);
    const customer = await customerRepository.findByEmail(email);
    if (!customer || customer.isDeleted || customer.account.isLocked) return;

    const accountId = customer.customerId;
    const last = await passwordResetOtpRepository.findLatest(accountId);
    if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_SECONDS * 1000) return;

    const otp = generateOtp();
    await passwordResetOtpRepository.invalidateAll(accountId);
    const record = await passwordResetOtpRepository.create({
      accountId,
      otpHash: hashOtp(accountId, otp),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    });

    try {
      await sendPasswordResetOtpMail({ to: email, fullName: customer.fullName, otp });
    } catch (err) {
      await passwordResetOtpRepository.remove(record.otpId).catch(() => {});
      throw err;
    }
  },

  /**
   * Quên mật khẩu — bước 2: kiểm tra OTP rồi đặt mật khẩu mới. Nhập sai quá
   * OTP_MAX_ATTEMPTS lần thì mã bị hủy; OTP chỉ dùng được 1 lần.
   */
  async resetPassword({ email: rawEmail, otp, newPassword }) {
    const email = normalizeEmail(rawEmail);
    const customer = await customerRepository.findByEmail(email);
    if (!customer || customer.isDeleted || customer.account.isLocked) {
      throw new ValidationError(OTP_INVALID_MESSAGE);
    }
    const account = customer.account;
    assertStrongPassword(newPassword, account.username);

    const record = await passwordResetOtpRepository.findLatestUnused(account.accountId);
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new ValidationError(OTP_INVALID_MESSAGE);
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await passwordResetOtpRepository.markUsed(record.otpId);
      throw new ValidationError('Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.');
    }

    if (!verifyOtpHash(account.accountId, otp, record.otpHash)) {
      const updated = await passwordResetOtpRepository.incrementAttempts(record.otpId);
      const left = OTP_MAX_ATTEMPTS - updated.attempts;
      if (left <= 0) {
        await passwordResetOtpRepository.markUsed(record.otpId);
        throw new ValidationError('Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.');
      }
      throw new ValidationError(`Mã OTP không đúng. Bạn còn ${left} lần thử.`);
    }

    if (await comparePassword(newPassword, account.passwordHash)) {
      throw new ValidationError('Mật khẩu mới phải khác mật khẩu hiện tại.');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.account.update({ where: { accountId: account.accountId }, data: { passwordHash } }),
      prisma.passwordResetOtp.updateMany({
        where: { accountId: account.accountId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
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

  /**
   * Admin phân quyền lại cho account. Nhận `roleName` (chuỗi, ví dụ "Manager")
   * — tự tra roleId tương ứng qua roleRepository.findByName() rồi mới cập nhật.
   */
  async updateRole(accountId, roleName) {
    await this.getById(accountId);
    const role = await roleRepository.findByName(roleName);
    if (!role) throw new NotFoundError(MESSAGES.NOT_FOUND.ROLE);
    return sanitize(await accountRepository.updateRole(accountId, role.roleId));
  },
};

export default accountService;
