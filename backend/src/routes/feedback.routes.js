import { Router } from 'express';
import { feedbackController } from '../controllers/index.js';
import { feedbackValidator } from '../validators/index.js';
import { authenticate, managerOnly, rateLimit, ownCustomerOnly, feedbackSpamGuard } from '../middleware/index.js';

const router = Router();

router.get('/', managerOnly, feedbackController.list);
router.get('/:id', authenticate, feedbackValidator.idParam, feedbackController.getById);

// Gửi phản hồi: đăng nhập -> giới hạn tần suất -> validate -> chỉ gửi dưới tên mình -> chống spam.
// (Trước đây khai báo POST / hai lần, bản đầu không có chống spam nên luôn khớp trước.)
router.post(
  '/',
  authenticate,
  rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Bạn gửi đánh giá quá nhiều lần.' }),
  feedbackValidator.create,
  ownCustomerOnly,
  feedbackSpamGuard,
  feedbackController.create
);

router.put(
  '/:id',
  authenticate,
  feedbackValidator.idParam,
  feedbackValidator.update,
  feedbackController.update
);

router.patch(
  '/:id/status',
  managerOnly,
  feedbackValidator.idParam,
  feedbackValidator.updateStatus,
  feedbackController.updateStatus
);
router.delete('/:id', managerOnly, feedbackValidator.idParam, feedbackController.remove);

export default router;
