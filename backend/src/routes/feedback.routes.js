import { Router } from 'express';
import { feedbackController } from '../controllers/index.js';
import { feedbackValidator } from '../validators/index.js';
import { authenticate, authorize, managerOnly, rateLimit, ownCustomerOnly, feedbackSpamGuard } from '../middleware/index.js';
import { ROLE_NAMES } from '../constants/index.js';

const router = Router();

router.get('/', managerOnly, feedbackController.list);
router.get('/:id', authenticate, feedbackValidator.idParam, feedbackController.getById);

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

// Manager xóa bất kỳ; Customer chỉ thu hồi đánh giá Pending của chính mình (kiểm tra trong controller).
router.delete(
  '/:id',
  authenticate,
  authorize(ROLE_NAMES.MANAGER, ROLE_NAMES.CUSTOMER),
  feedbackValidator.idParam,
  feedbackController.remove
);

export default router;