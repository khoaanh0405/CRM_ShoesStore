/**
 * /api/admin — các endpoint dành RIÊNG cho Admin, tách biệt khỏi luồng
 * khách hàng tự thao tác (đúng phương án "Tách biệt API" cho mục 4.1.1
 * "Thêm một khách hàng mới"). Mọi route trong file này đều bắt buộc
 * adminOnly (authenticate + authorize('Admin')) — không có route công khai
 * nào ở đây, khác với account.routes.js (có /register, /login công khai).
 *
 * POST /api/admin/customers khác POST /api/accounts/register ở 2 điểm:
 *  1) Quyền hạn: route này gắn adminOnly, chỉ Admin (đã đăng nhập, đúng
 *     role) mới gọi được — không phải endpoint công khai cho khách tự đăng ký.
 *  2) Mật khẩu: `password` trong body là mật khẩu KHỞI TẠO do Admin tự nhập
 *     cho khách hàng, không phải khách hàng tự đặt khi đăng ký.
 * Nghiệp vụ tạo Account+Customer dùng chung với accountService.registerCustomer
 * qua accountService.createCustomerByAdmin (xem account.service.js) để không
 * lặp lại logic nested-write Account+Customer ở 2 nơi.
 */
import { Router } from 'express';
import { accountController } from '../controllers/index.js';
import { accountValidator } from '../validators/index.js';
import { adminOnly } from '../middleware/index.js';

const router = Router();

router.post(
  '/customers',
  adminOnly,
  accountValidator.createCustomerByAdmin,
  accountController.createCustomerByAdmin
);

export default router;
