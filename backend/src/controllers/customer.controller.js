/**
 * Controller cho Customer. DELETE /api/customers/:id gọi customerService.remove()
 * — vốn là SOFT DELETE, dữ liệu lịch sử vẫn giữ nguyên.
 */
import { customerService } from '../services/index.js';
import { parseId, parseBoolean } from '../utils/index.js';

export const customerController = {
  async list(req, res) {
    const includeDeleted = parseBoolean(req.query.includeDeleted) ?? false;
    res.json(await customerService.list({ includeDeleted }));
  },

  /** Báo cáo khách hàng: giới tính / độ tuổi / sở thích (mục 4.1.5). */
  async report(req, res) {
    res.json(await customerService.report());
  },

  async search(req, res) {
    const { keyword, gender } = req.query;
    const includeDeleted = parseBoolean(req.query.includeDeleted) ?? false;
    res.json(await customerService.search({ keyword, gender, includeDeleted }));
  },

  async getById(req, res) {
    const customerId = parseId(req.params.id, 'customerId');
    const includeDeleted = parseBoolean(req.query.includeDeleted) ?? false;
    res.json(await customerService.getById(customerId, { includeDeleted }));
  },

  /** Hồ sơ đầy đủ kèm username/isLocked của Account. */
  async getProfile(req, res) {
    const customerId = parseId(req.params.id, 'customerId');
    res.json(await customerService.getProfile(customerId));
  },

  /**
   * requesterId lấy từ req.user (middleware auth gắn vào sau khi verify JWT).
   * Hiện chưa có middleware auth nên req.user undefined => Service hiểu là
   * Admin gọi và bỏ qua bước kiểm tra "chỉ được sửa hồ sơ của chính mình".
   */
  async updateProfile(req, res) {
    const customerId = parseId(req.params.id, 'customerId');
    const { fullName, dateOfBirth, gender, phone, address } = req.body;
    const requesterId = req.user?.customerId;
    res.json(await customerService.updateProfile(
      customerId,
      { fullName, dateOfBirth, gender, phone, address },
      requesterId
    ));
  },

  async remove(req, res) {
    const customerId = parseId(req.params.id, 'customerId');
    res.json(await customerService.remove(customerId));
  },
};

export default customerController;
