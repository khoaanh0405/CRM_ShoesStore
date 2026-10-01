import { MESSAGES, PREFERENCE_TAGS } from '../constants/index.js';
import { customerPreferenceRepository, customerRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';

function assertAllowedTag(preferenceTag) {
  if (!preferenceTag?.trim()) throw new ValidationError('Sở thích không được để trống.');
  if (!PREFERENCE_TAGS.includes(preferenceTag.trim())) {
    throw new ValidationError(
      `Sở thích không hợp lệ. Chỉ được chọn trong danh sách: ${PREFERENCE_TAGS.join(', ')}.`
    );
  }
}

export const customerPreferenceService = {
  async listByCustomer(customerId) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    return customerPreferenceRepository.findByCustomerId(customerId);
  },

  async add(customerId, preferenceTag) {
    assertAllowedTag(preferenceTag);
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new NotFoundError(MESSAGES.NOT_FOUND.CUSTOMER);
    const existing = await customerPreferenceRepository.findByCustomerId(customerId);
    if (existing.some((p) => p.preferenceTag === preferenceTag.trim())) {
      throw new ValidationError(`"${preferenceTag.trim()}" đã nằm trong danh sách sở thích của bạn.`);
    }
    return customerPreferenceRepository.create({ customerId, preferenceTag: preferenceTag.trim() });
  },

  async update(preferenceId, preferenceTag) {
    assertAllowedTag(preferenceTag);
    const existed = await customerPreferenceRepository.findById(preferenceId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.PREFERENCE);
    return customerPreferenceRepository.update(preferenceId, { preferenceTag: preferenceTag.trim() });
  },

  async remove(preferenceId) {
    const existed = await customerPreferenceRepository.findById(preferenceId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.PREFERENCE);
    return customerPreferenceRepository.remove(preferenceId);
  },

  countByTag() {
    return customerPreferenceRepository.countByTag();
  },
};

export default customerPreferenceService;