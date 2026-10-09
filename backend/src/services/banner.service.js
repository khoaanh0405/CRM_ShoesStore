import { bannerRepository } from '../repositories/banner.repository.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';

const MAX_IMAGE_LENGTH = 6_000_000;

function assertImage(imageUrl) {
  const v = String(imageUrl ?? '').trim();
  if (!/^(https?:\/\/|data:image\/)/i.test(v)) throw new ValidationError('Ảnh banner phải là đường dẫn http(s) hoặc ảnh tải lên.');
  if (v.length > MAX_IMAGE_LENGTH) throw new ValidationError('Ảnh banner quá lớn.');
  return v;
}

export const bannerService = {
  listActive: () => bannerRepository.findActive(),
  listAll: () => bannerRepository.findAll(),

  async getById(id) {
    const b = await bannerRepository.findById(id);
    if (!b) throw new NotFoundError('Không tìm thấy banner.');
    return b;
  },

  create({ imageUrl, title, sortOrder, isActive }) {
    return bannerRepository.create({
      imageUrl: assertImage(imageUrl),
      title: title?.trim() || null,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      isActive: isActive !== undefined ? isActive === true || isActive === 'true' : true,
    });
  },

  async update(id, { imageUrl, title, sortOrder, isActive }) {
    await this.getById(id);
    return bannerRepository.update(id, {
      ...(imageUrl !== undefined && { imageUrl: assertImage(imageUrl) }),
      ...(title !== undefined && { title: title?.trim() || null }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' }),
    });
  },

  async setActive(id, isActive) {
    await this.getById(id);
    return bannerRepository.update(id, { isActive: isActive === true || isActive === 'true' });
  },

  async remove(id) {
    await this.getById(id);
    return bannerRepository.remove(id);
  },
};

export default bannerService;