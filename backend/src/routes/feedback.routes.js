import { Router } from 'express';
import { feedbackController } from '../controllers/index.js';
import { feedbackValidator } from '../validators/index.js';
import { authenticate, managerOnly } from '../middleware/index.js';

const router = Router();

router.get('/', managerOnly, feedbackController.list);
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
  managerOnly,
  feedbackValidator.idParam,
  feedbackValidator.updateStatus,
  feedbackController.updateStatus
);
router.delete('/:id', managerOnly, feedbackValidator.idParam, feedbackController.remove);

export default router;