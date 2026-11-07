import prisma from '../config/database.js';
import {
  accountRepository,
  roleRepository,
  customerRepository,
  employeeRepository,
} from '../repositories/index.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '../errors/AppError.js';
import { ROLE_NAMES, MESSAGES } from '../constants/index.js';
import { employeeService } from './employee.service.js';
import {
  hashPassword, comparePassword,
  assertStrictEmail, assertStrongPassword,
} from '../utils/index.js';
import { normalizeNamePart } from '../utils/name.util.js';

/** Không bao giờ trả passwordHash ra ngoài Service/Controller. */
function sanitize(account) {
  if (!account) return account;
  const { passwordHash, ...rest } = account;
  return rest;
}

const STAFF_ROLE_NAMES = [ROLE_NAMES.ADMIN, ROLE_NAMES.MANAGER];

/** Email phải chưa được dùng ở cả bảng accounts (Admin/Manager/Customer) lẫn customers, employees. */
async function assertEmailAvailable(normalizedEmail) {
  const [accountOwner, customerOwner, employeeOwner] = await Promise.all([
    accountRepository.findByEmail(normalizedEmail),
    customerRepository.findByEmail(normalizedEmail),
    employeeRepository.findByEmail(normalizedEmail),
  ]);
  if (accountOwner || customerOwner || employeeOwner) {
    throw new ConflictError('Email này đã được sử dụng bởi tài khoản khác.');
  }
}

async function createAccountWithNewCustomer({
  username,
  password,
  lastName,
  firstName,
  email,
  dateOfBirth,
  gender,
  phone,
  address,
}) {
  if (!username?.trim() || !password || !lastName?.trim() || !firstName?.trim() || !dateOfBirth) {
    throw new ValidationError('Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu, họ, tên và ngày sinh.');
  }
  const normalizedEmail = assertStrictEmail(email);
  assertStrongPassword(password, username);

  const existed = await accountRepository.findByUsername(username.trim());
  if (existed) throw new ConflictError(`Tên đăng nhập "${username}" đã tồn tại.`);

  await assertEmailAvailable(normalizedEmail);

  const customerRole = await roleRepository.findByName(ROLE_NAMES.CUSTOMER);
  if (!customerRole) throw new NotFoundError(`Hệ thống chưa cấu hình vai trò "${ROLE_NAMES.CUSTOMER}".`);

  const passwordHash = await hashPassword(password);

  const account = await prisma.account.create({
    data: {
      username: username.trim(),
      // Đồng bộ email vào bảng accounts (giống seed.js) để unique toàn hệ thống.
      email: normalizedEmail,
      passwordHash,
      roleId: customerRole.roleId,
      isLocked: false,
      customer: {
        create: {
          firstName: normalizeNamePart(firstName),
          lastName: normalizeNamePart(lastName),
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phone,
          email: normalizedEmail,
          address,
        },
      },
    },
    include: { role: true, customer: true, employee: true },
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
   * Admin tạo tài khoản nội bộ (Admin hoặc Manager) — POST /api/admin/staff.
   * Tạo đồng thời Account + Employee (hồ sơ nhân sự); không có hồ sơ Customer.
   */
  async createStaff({ username, lastName, firstName, email, password, roleName, dateOfBirth, gender, phone, address, position }) {
    if (!username?.trim()) throw new ValidationError('Vui lòng nhập tên đăng nhập.');
    if (!lastName?.trim()) throw new ValidationError('Vui lòng nhập họ của nhân sự.');
    if (!firstName?.trim()) throw new ValidationError('Vui lòng nhập tên của nhân sự.');
    const cleanUsername = username.trim();

    if (cleanUsername.length < 4 || cleanUsername.length > 50) {
      throw new ValidationError('Tên đăng nhập từ 4 đến 50 ký tự.');
    }
    if (!/^[A-Za-z0-9._]+$/.test(cleanUsername)) {
      throw new ValidationError('Tên đăng nhập chỉ gồm chữ cái không dấu, số, dấu chấm và gạch dưới.');
    }
    if (!STAFF_ROLE_NAMES.includes(roleName)) {
      throw new ValidationError('Vai trò chỉ có thể là Admin hoặc Manager.');
    }

    const normalizedEmail = assertStrictEmail(email);
    assertStrongPassword(password, cleanUsername);

    if (await accountRepository.findByUsername(cleanUsername)) {
      throw new ConflictError(`Tên đăng nhập "${cleanUsername}" đã tồn tại.`);
    }
    await assertEmailAvailable(normalizedEmail);

    const role = await roleRepository.findByName(roleName);
    if (!role) throw new NotFoundError(MESSAGES.NOT_FOUND.ROLE);

    const account = await accountRepository.createWithEmployee({
      username: cleanUsername,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      roleId: role.roleId,
      employee: {
        firstName: normalizeNamePart(firstName),
        lastName: normalizeNamePart(lastName),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        phone: phone || null,
        email: normalizedEmail,
        address: address || null,
        position: position?.trim() || (roleName === ROLE_NAMES.ADMIN ? 'Quản trị viên hệ thống' : 'Quản lý CRM'),
      },
    });
    return sanitize(account);
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

    // Tài khoản nội bộ (Admin/Manager) không có hồ sơ Customer. Đổi sang Customer sẽ tạo
    // ra khách hàng "mồ côi" làm hỏng web khách hàng (404 ở mọi API /customers/:id/...).
    if (role.roleName === ROLE_NAMES.CUSTOMER) {
      const profile = await customerRepository.findByIdWithAccount(accountId);
      if (!profile) {
        throw new ValidationError('Tài khoản nội bộ chưa có hồ sơ khách hàng nên không thể đổi sang vai trò Khách hàng.');
      }
    }
    const updated = await accountRepository.updateRole(accountId, role.roleId);
    // Lên Admin/Manager mà chưa có hồ sơ nhân sự (ví dụ trước đây là khách hàng) -> tạo hồ sơ Employee.
    if (STAFF_ROLE_NAMES.includes(role.roleName)) {
      await employeeService.ensureForAccount(accountId);
      return sanitize(await accountRepository.findById(accountId));
    }
    return sanitize(updated);
  },
};

export default accountService;
