/**
 * Service cho Customer. Điểm quan trọng nhất: mọi thao tác "xóa" khách hàng
 * (mục 4.1.2) đều là soft delete — Service này KHÔNG bao giờ gọi hard delete
 * (đúng thiết kế trong customer.repository.js).
 */
import { customerRepository, customerPreferenceRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../errors/AppError.js';

function calcAge(dateOfBirth) {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthdayThisYear =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthdayThisYear) age -= 1;
  return age;
}

function ageBucketOf(age) {
  if (age < 18) return 'Dưới 18';
  if (age <= 24) return '18-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  return '55+';
}

export const customerService = {
  list({ includeDeleted = false } = {}) {
    return customerRepository.findAll({ includeDeleted });
  },

  async getById(customerId, options = {}) {
    const customer = await customerRepository.findById(customerId, options);
    if (!customer) throw new NotFoundError('Không tìm thấy khách hàng.');
    return customer;
  },

  /** Hồ sơ đầy đủ (kèm username/isLocked) — dùng cho trang chi tiết Admin hoặc trang cá nhân Customer. */
  async getProfile(customerId) {
    const customer = await customerRepository.findByIdWithAccount(customerId);
    if (!customer) throw new NotFoundError('Không tìm thấy khách hàng.');
    const { account, ...rest } = customer;
    return { ...rest, username: account.username, isLocked: account.isLocked };
  },

  search({ keyword, gender, includeDeleted = false } = {}) {
    return customerRepository.search({ keyword, gender, includeDeleted });
  },

  /**
   * Khách hàng tự sửa thông tin (mục 4.3.2). requesterId là customerId của
   * người đang đăng nhập (lấy từ token/session ở Controller) — truyền vào
   * đây để đảm bảo không sửa được hồ sơ người khác. Bỏ trống nếu Admin gọi.
   */
  async updateProfile(customerId, { fullName, dateOfBirth, gender, phone, address }, requesterId) {
    if (requesterId !== undefined && requesterId !== customerId) {
      throw new ForbiddenError('Không thể chỉnh sửa thông tin của khách hàng khác.');
    }
    await this.getById(customerId);

    if (fullName !== undefined && !fullName.trim()) {
      throw new ValidationError('Họ tên không được để trống.');
    }

    return customerRepository.update(customerId, {
      fullName: fullName?.trim(),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      phone,
      address,
    });
  },

  /** Admin "Xóa khách hàng" (mục 4.1.2) — luôn là soft delete. */
  async remove(customerId) {
    const customer = await this.getById(customerId);
    if (customer.isDeleted) throw new ValidationError('Khách hàng này đã bị xóa trước đó.');
    return customerRepository.softDelete(customerId);
  },

  /**
   * Báo cáo khách hàng: tỷ lệ giới tính, độ tuổi, sở thích (mục 4.1.5).
   * Chỉ tính trên khách hàng đang hoạt động (chưa bị soft-delete).
   */
  async report() {
    const [genderGroups, preferenceGroups, customers] = await Promise.all([
      customerRepository.countByGender(),
      customerPreferenceRepository.countByTag(),
      customerRepository.findAll(),
    ]);

    const ageBuckets = {};
    for (const c of customers) {
      const bucket = ageBucketOf(calcAge(c.dateOfBirth));
      ageBuckets[bucket] = (ageBuckets[bucket] || 0) + 1;
    }

    return {
      totalActiveCustomers: customers.length,
      byGender: genderGroups.map((g) => ({ gender: g.gender ?? 'Không rõ', count: g._count._all })),
      byAgeGroup: Object.entries(ageBuckets).map(([bucket, count]) => ({ bucket, count })),
      byPreference: preferenceGroups.map((p) => ({ tag: p.preferenceTag, count: p._count._all })),
    };
  },
};

export default customerService;
