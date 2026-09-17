import { MESSAGES } from '../constants/index.js';
import { customerPreferenceRepository, customerRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';

export const customerPreferenceService = {
  async listByCustomer(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return customerPreferenceRepository.findByCustomerId(customerId);
  },

  async add(customerId, preferenceTag) {
    if (!preferenceTag?.trim()) throw new ValidationError('Sở thích không được để trống.');
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return customerPreferenceRepository.create({ customerId, preferenceTag: preferenceTag.trim() });
  },

  async update(preferenceId, preferenceTag) {
    if (!preferenceTag?.trim()) throw new ValidationError('Sở thích không được để trống.');
    const existed = await customerPreferenceRepository.findById(preferenceId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.PREFERENCE);
    return customerPreferenceRepository.update(preferenceId, { preferenceTag: preferenceTag.trim() });
  },

  async remove(preferenceId) {
    const existed = await customerPreferenceRepository.findById(preferenceId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.PREFERENCE);
    return customerPreferenceRepository.remove(preferenceId);
  },

  /** Thống kê tỷ lệ sở thích khách hàng — dùng trực tiếp trong customer.service.js#report(). */
  countByTag() {
    return customerPreferenceRepository.countByTag();
  },
};

export default customerPreferenceService;
