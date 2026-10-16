import prisma from '../config/database.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { assertStrictEmail } from '../utils/index.js';

const SELECT = {
  accountId: true, username: true, email: true, fullName: true, phone: true, dateOfBirth: true, address: true, isLocked: true, createdAt: true,
  role: { select: { roleId: true, roleName: true } },
};

export const profileService = {
  async getMe(accountId) {
    const a = await prisma.account.findUnique({ where: { accountId }, select: SELECT });
    if (!a) throw new NotFoundError('Không tìm thấy tài khoản.');
    return a;
  },
  async updateMe(accountId, { fullName, email, phone, dateOfBirth, address }) {
    const name = String(fullName ?? '').trim();
    if (!name) throw new ValidationError('Họ tên không được để trống.');
    const mail = assertStrictEmail(email);
    const tel = String(phone ?? '').trim();
    if (tel && !/^[0-9+\s.-]{9,15}$/.test(tel)) throw new ValidationError('Số điện thoại không hợp lệ.');
    let dob = null;
    if (dateOfBirth) {
      dob = new Date(dateOfBirth);
      if (Number.isNaN(dob.getTime()) || dob > new Date()) throw new ValidationError('Ngày sinh không hợp lệ.');
    }
    const owner = await prisma.account.findUnique({ where: { email: mail }, select: { accountId: true } });
    if (owner && owner.accountId !== accountId) throw new ConflictError('Email này đã được sử dụng bởi tài khoản khác.');
    return prisma.account.update({ where: { accountId }, data: { fullName: name, email: mail, phone: tel || null, dateOfBirth: dob, address: String(address ?? '').trim() || null }, select: SELECT });
  },
};
export default profileService;
