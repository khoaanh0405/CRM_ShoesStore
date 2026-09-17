/**
 * /api/feedbacks — phản hồi sản phẩm.
 * Khách hàng đã đăng nhập được tạo/sửa phản hồi; duyệt trạng thái và xóa là
 * việc của Admin (mục 4.1.4 "Tiếp nhận/xử lý phản hồi").
 */
import { Router } from 'express';
import { feedbackController } from '../controllers/index.js';
import { feedbackValidator } from '../validators/index.js';
import { authenticate, adminOnly } from '../middleware/index.js';

const router = Router();

router.get('/', adminOnly, feedbackController.list);
router.get('/:id', authenticate, feedbackValidator.idParam, feedbackController.getById);

router.post('/', authenticate, feedbackValidator.create, feedbackController.create);
router.put(
  '/:id',
  authenticate,
  feedbackValidator.idParam,
  feedbackValidator.update,
  feedbackController.update
);

router.patch(
  '/:id/status',
  adminOnly,
  feedbackValidator.idParam,
  feedbackValidator.updateStatus,
  feedbackController.updateStatus
);
router.delete('/:id', adminOnly, feedbackValidator.idParam, feedbackController.remove);

export default router;
