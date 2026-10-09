import { bannerService } from '../services/banner.service.js';
import { parseId } from '../utils/index.js';

export const bannerController = {
  /**
   * Endpoint công khai cho web khách hàng. Banner chỉ là phần trang trí nên nếu
   * đọc DB lỗi (vd: chưa chạy migration tạo bảng "banners") thì trả mảng rỗng
   * để trang vẫn hiển thị bình thường, đồng thời log lỗi thật ra terminal để sửa.
   */
  async listActive(req, res) {
    try {
      res.json(await bannerService.listActive());
    } catch (err) {
      console.error('[BANNER] Không đọc được banner (đã chạy "npx prisma migrate deploy" và "npx prisma generate" chưa?):', err.message);
      res.json([]);
    }
  },
  async listAll(req, res) {
    res.json(await bannerService.listAll());
  },
  async create(req, res) {
    res.status(201).json(await bannerService.create(req.body));
  },
  async update(req, res) {
    res.json(await bannerService.update(parseId(req.params.id, 'bannerId'), req.body));
  },
  async setActive(req, res) {
    res.json(await bannerService.setActive(parseId(req.params.id, 'bannerId'), req.body.isActive));
  },
  async remove(req, res) {
    await bannerService.remove(parseId(req.params.id, 'bannerId'));
    res.status(204).send();
  },
};

export default bannerController;
