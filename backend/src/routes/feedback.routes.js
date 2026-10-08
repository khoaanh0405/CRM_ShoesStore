import { Router } from 'express';
import { feedbackController } from '../controllers/index.js';
import { reviewReplyController } from '../controllers/reviewReply.controller.js';
import { feedbackValidator } from '../validators/index.js';
import { validateBody } from '../validators/common.validator.js';
import { authenticate, authorize, managerOnly, staffOnly, rateLimit, ownCustomerOnly, feedbackSpamGuard } from '../middleware/index.js';
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

// Khách chỉnh sửa đánh giá của mình khi còn Pending (kiểm tra trong controller)
router.put(
  '/:id',
  authenticate,
  authorize(ROLE_NAMES.CUSTOMER),
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

// --- Manager trả lời đánh giá (ReviewReply) ---
router.get('/:id/replies', staffOnly, feedbackValidator.idParam, reviewReplyController.listByFeedback);
router.post(
  '/:id/replies',
  managerOnly,
  feedbackValidator.idParam,
  validateBody({ content: { required: true, type: 'string', maxLength: 2000 } }),
  reviewReplyController.create
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLE_NAMES.MANAGER, ROLE_NAMES.CUSTOMER),
  feedbackValidator.idParam,
  feedbackController.remove
);

export default router;