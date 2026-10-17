/**
 * Service cho Customer. Điểm quan trọng nhất: mọi thao tác "xóa" khách hàng
 * (mục 4.1.2) đều là soft delete — Service này KHÔNG bao giờ gọi hard delete
 * (đúng thiết kế trong customer.repository.js).
 */
import { customerRepository, customerPreferenceRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../errors/AppError.js';
import { AGE_BUCKETS, MESSAGES } from '../constants/index.js';
import { calculateAge, assertStrictEmail } from '../utils/index.js';
import { normalizeNamePart, withFullName } from '../utils/name.util.js';

function ageBucketOf(age) {
  const bucket = AGE_BUCKETS.find((b) => age >= b.min && age <= b.max);
  return bucket ? bucket.label : 'Không rõ';
}

export const customerService = {
  async list({ includeDeleted = false } = {}) {
    const customers = await customerRepository.findAll({ includeDeleted });
    return customers.map(({ account, customerPreferences, ...c }) => {
      // Sở thích = danh mục khách đã chọn (bỏ danh mục đã bị xóa mềm).
      const alive = (customerPreferences ?? []).filter((p) => !p.category?.isDeleted);
      return {
        ...withFullName(c),
        isLocked: account?.isLocked ?? false,
        customerPreferences: alive,
        preferences: alive.map((p) => ({ categoryId: p.categoryId, categoryName: p.category.categoryName })),
      };
    });
  },

  async getById(customerId, options = {}) {
    const customer = await customerRepository.findById(customerId, options);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return withFullName(customer);
  },

  /** Hồ sơ đầy đủ (kèm username/isLocked) — dùng cho trang chi tiết Admin hoặc trang cá nhân Customer. */
  async getProfile(customerId) {
    const customer = await customerRepository.findByIdWithAccount(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    const { account, ...rest } = customer;
    return { ...withFullName(rest), username: account.username, isLocked: account.isLocked };
  },

  async search({ keyword, gender, includeDeleted = false } = {}) {
    const rows = await customerRepository.search({ keyword, gender, includeDeleted });
    return rows.map(withFullName);
  },

  /**
   * Khách hàng tự sửa thông tin (mục 4.3.2). requesterId là customerId của
   * người đang đăng nhập (lấy từ token/session ở Controller) — truyền vào
   * đây để đảm bảo không sửa được hồ sơ người khác. Bỏ trống nếu Admin gọi.
   */
  async updateProfile(customerId, { firstName, lastName, dateOfBirth, gender, phone, email, address }, requesterId) {
    if (requesterId !== undefined && requesterId !== customerId) {
      throw new ForbiddenError('Không thể chỉnh sửa thông tin của khách hàng khác.');
    }
    await this.getById(customerId);

    if (lastName !== undefined && !String(lastName).trim()) {
      throw new ValidationError('Họ không được để trống.');
    }
    if (firstName !== undefined && !String(firstName).trim()) {
      throw new ValidationError('Tên không được để trống.');
    }

    // Đổi email: phải hợp lệ và không trùng với khách hàng khác.
    let normalizedEmail;
    if (email !== undefined) {
      normalizedEmail = assertStrictEmail(email);
      const owner = await customerRepository.findByEmail(normalizedEmail);
      if (owner && owner.customerId !== customerId) {
        throw new ConflictError('Email này đã được sử dụng bởi tài khoản khác.');
      }
    }

    const updated = await customerRepository.update(customerId, {
      firstName: normalizeNamePart(firstName),
      lastName: normalizeNamePart(lastName),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      phone,
      email: normalizedEmail,
      address,
    });
    return withFullName(updated);
  },

  /** Admin "Xóa khách hàng" (mục 4.1.2) — luôn là soft delete. */
  async remove(customerId) {
    const customer = await this.getById(customerId);
    if (customer.isDeleted) throw new ValidationError('Khách hàng này đã bị xóa trước đó.');
    return withFullName(await customerRepository.softDelete(customerId));
  },

  /**
   * Báo cáo khách hàng: tỷ lệ giới tính, độ tuổi, sở thích (mục 4.1.5).
   * Chỉ tính trên khách hàng đang hoạt động (chưa bị soft-delete).
   */
  async report() {
    const [genderGroups, preferenceGroups, customers] = await Promise.all([
      customerRepository.countByGender(),
      customerPreferenceRepository.countByCategory(),
      customerRepository.findAll(),
    ]);

    const ageBuckets = {};
    for (const c of customers) {
      const bucket = ageBucketOf(calculateAge(c.dateOfBirth));
      ageBuckets[bucket] = (ageBuckets[bucket] || 0) + 1;
    }

    return {
      totalActiveCustomers: customers.length,
      byGender: genderGroups.map((g) => ({ gender: g.gender ?? 'Không rõ', count: g._count._all })),
      byAgeGroup: Object.entries(ageBuckets).map(([bucket, count]) => ({ bucket, count })),
      // tag = tên danh mục (giữ tên trường để các màn hình báo cáo hiện có vẫn dùng được)
      byPreference: preferenceGroups.map((p) => ({ categoryId: p.categoryId, tag: p.categoryName, count: p.count })),
    };
  },
};

export default customerService;
