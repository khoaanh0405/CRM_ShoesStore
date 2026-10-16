/**
 * Sở thích mua sắm của khách hàng = danh sách DANH MỤC (categories) khách chọn.
 * Không còn lưu chuỗi tên danh mục: chỉ nhận categoryId hợp lệ (danh mục có thật, chưa bị xóa)
 * và không cho chọn trùng (đã có UNIQUE (customer_id, category_id) ở CSDL, kiểm tra thêm ở đây
 * để trả thông báo dễ hiểu).
 */
import { MESSAGES } from '../constants/index.js';
import { customerPreferenceRepository, customerRepository } from '../repositories/index.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../errors/AppError.js';
import { ROLE_NAMES } from '../constants/role.constant.js';

function parseCategoryId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Danh mục không hợp lệ.');
  return id;
}

async function assertCategoryExists(categoryId) {
  const category = await categoryRepository.findById(categoryId);
  if (!category) throw new NotFoundError(MESSAGES.NOT_FOUND.CATEGORY);
  return category;
}

/** Khách hàng chỉ được thao tác trên sở thích của chính mình (Admin/Manager thì không bị giới hạn). */
function assertOwner(requester, customerId) {
  if (requester?.roleName === ROLE_NAMES.CUSTOMER && requester.customerId !== customerId) {
    throw new ForbiddenError('Bạn chỉ được chỉnh sửa sở thích của chính mình.');
  }
}

export const customerPreferenceService = {
  async listByCustomer(customerId, requester) {
    assertOwner(requester, customerId);
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return customerPreferenceRepository.findByCustomerId(customerId);
  },

  async add(customerId, categoryId, requester) {
    assertOwner(requester, customerId);
    const catId = parseCategoryId(categoryId);
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    const category = await assertCategoryExists(catId);
    if (await customerPreferenceRepository.findByCustomerAndCategory(customerId, catId)) {
      throw new ConflictError(`"${category.categoryName}" đã nằm trong danh sách sở thích của bạn.`);
    }
    return customerPreferenceRepository.create({ customerId, categoryId: catId });
  },

  async update(preferenceId, categoryId, requester) {
    const catId = parseCategoryId(categoryId);
    const existed = await customerPreferenceRepository.findById(preferenceId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.PREFERENCE);
    assertOwner(requester, existed.customerId);
    const category = await assertCategoryExists(catId);
    const dup = await customerPreferenceRepository.findByCustomerAndCategory(existed.customerId, catId);
    if (dup && dup.preferenceId !== preferenceId) {
      throw new ConflictError(`"${category.categoryName}" đã nằm trong danh sách sở thích của bạn.`);
    }
    return customerPreferenceRepository.update(preferenceId, { categoryId: catId });
  },

  async remove(preferenceId, requester) {
    const existed = await customerPreferenceRepository.findById(preferenceId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.PREFERENCE);
    assertOwner(requester, existed.customerId);
    return customerPreferenceRepository.remove(preferenceId);
  },

  countByCategory() {
    return customerPreferenceRepository.countByCategory();
  },
};

export default customerPreferenceService;
