/**
 * Service cho Employee (hồ sơ Admin/Manager).
 *  - getMe / updateMe: nhân sự xem & sửa thông tin của CHÍNH MÌNH (yêu cầu đồ án: "Xem, sửa thông tin của chính mình").
 *  - ensureForAccount: đảm bảo mọi tài khoản Admin/Manager đều có hồ sơ Employee
 *    (dùng khi đổi vai trò Customer -> Admin/Manager, hoặc tài khoản tạo từ trước khi có bảng employees).
 *  - list: Admin xem danh sách nhân sự.
 */
import { employeeRepository, accountRepository, customerRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { MESSAGES, ROLE_NAMES } from '../constants/index.js';
import { assertStrictEmail } from '../utils/index.js';
import prisma from '../config/database.js';

const DEFAULT_POSITION = {
  [ROLE_NAMES.ADMIN]: 'Quản trị viên hệ thống',
  [ROLE_NAMES.MANAGER]: 'Quản lý CRM',
};

/** Gộp hồ sơ nhân sự + thông tin tài khoản (không có passwordHash) thành 1 đối tượng trả về frontend. */
function toProfile(employee) {
  const { account, ...rest } = employee;
  return {
    ...rest,
    username: account.username,
    isLocked: account.isLocked,
    role: account.role,
    roleName: account.role?.roleName,
  };
}

export const employeeService = {
  async list() {
    const rows = await employeeRepository.findAll();
    return rows.map(toProfile);
  },

  /** Đảm bảo tài khoản nội bộ có hồ sơ Employee; chưa có thì tạo từ thông tin sẵn có. */
  async ensureForAccount(accountId) {
    const existed = await employeeRepository.findById(accountId);
    if (existed) return existed;

    const account = await accountRepository.findById(accountId);
    if (!account) throw new NotFoundError(MESSAGES.NOT_FOUND.ACCOUNT);
    const roleName = account.role?.roleName;
    if (roleName !== ROLE_NAMES.ADMIN && roleName !== ROLE_NAMES.MANAGER) {
      throw new ValidationError('Chỉ tài khoản Admin/Manager mới có hồ sơ nhân sự.');
    }
    // Nếu trước đây là khách hàng thì tận dụng họ tên/ngày sinh/... sẵn có.
    const c = account.customer;
    return employeeRepository.create({
      employeeId: accountId,
      fullName: c?.fullName ?? account.username,
      dateOfBirth: c?.dateOfBirth ?? null,
      gender: c?.gender ?? null,
      phone: c?.phone ?? null,
      email: account.email ?? null,
      address: c?.address ?? null,
      position: DEFAULT_POSITION[roleName],
    });
  },

  async getMe(accountId) {
    await this.ensureForAccount(accountId);
    const employee = await employeeRepository.findByIdWithAccount(accountId);
    if (!employee) throw new NotFoundError(MESSAGES.NOT_FOUND.EMPLOYEE);
    return toProfile(employee);
  },

  /** Nhân sự tự sửa thông tin của mình. `position` do Admin quyết định nên không cho tự sửa ở đây. */
  async updateMe(accountId, { fullName, dateOfBirth, gender, phone, email, address }) {
    await this.ensureForAccount(accountId);

    if (fullName !== undefined && !String(fullName).trim()) {
      throw new ValidationError('Họ tên không được để trống.');
    }

    let normalizedEmail;
    if (email !== undefined) {
      normalizedEmail = assertStrictEmail(email);
      const [accOwner, cusOwner, empOwner] = await Promise.all([
        accountRepository.findByEmail(normalizedEmail),
        customerRepository.findByEmail(normalizedEmail),
        employeeRepository.findByEmail(normalizedEmail),
      ]);
      if ((accOwner && accOwner.accountId !== accountId) || cusOwner || (empOwner && empOwner.employeeId !== accountId)) {
        throw new ConflictError('Email này đã được sử dụng bởi tài khoản khác.');
      }
    }

    // Email lưu đồng bộ ở cả accounts và employees (giống khách hàng) nên cập nhật trong 1 transaction.
    await prisma.$transaction([
      prisma.employee.update({
        where: { employeeId: accountId },
        data: {
          fullName: fullName?.trim(),
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          phone,
          email: normalizedEmail,
          address,
        },
      }),
      ...(normalizedEmail !== undefined
        ? [prisma.account.update({ where: { accountId }, data: { email: normalizedEmail } })]
        : []),
    ]);
    return this.getMe(accountId);
  },
};

export default employeeService;
