import { Router } from 'express';
import {
  customerController,
  customerPreferenceController,
  feedbackController,
  surveyTargetController,
  surveyResponseController,
  notificationController,
} from '../controllers/index.js';
import {
  customerValidator,
  customerPreferenceValidator,
  feedbackValidator,
  surveyTargetValidator,
  surveyResponseValidator,
  notificationValidator,
} from '../validators/index.js';
import { authenticate, managerOnly, staffOnly } from '../middleware/index.js';

const router = Router();

router.get('/report', staffOnly, customerController.report);
router.get('/search', staffOnly, customerController.search);
router.get('/', staffOnly, customerController.list);
router.delete('/:id', staffOnly, customerValidator.idParam, customerController.remove);
router.get('/:id/profile', authenticate, customerValidator.idParam, customerController.getProfile);
router.put(
  '/:id',
  authenticate,
  customerValidator.idParam,
  customerValidator.updateProfile,
  customerController.updateProfile
);
router.delete('/:id', managerOnly, customerValidator.idParam, customerController.remove);

router.get(
  '/:customerId/preferences',
  authenticate,
  customerPreferenceValidator.customerIdParam,
  customerPreferenceController.listByCustomer
);
router.post(
  '/:customerId/preferences',
  authenticate,
  customerPreferenceValidator.customerIdParam,
  customerPreferenceValidator.save,
  customerPreferenceController.add
);
router.get(
  '/:customerId/feedbacks',
  authenticate,
  feedbackValidator.customerIdParam,
  feedbackController.listByCustomer
);
router.get(
  '/:customerId/surveys',
  authenticate,
  surveyTargetValidator.customerIdParam,
  surveyTargetController.listByCustomer
);
router.get(
  '/:customerId/responses',
  authenticate,
  surveyResponseValidator.customerIdParam,
  surveyResponseController.listByCustomer
);
router.get(
  '/:customerId/notifications',
  authenticate,
  notificationValidator.customerIdParam,
  notificationController.listByCustomer
);
router.get(
  '/:customerId/notifications/unread-count',
  authenticate,
  notificationValidator.customerIdParam,
  notificationController.countUnread
);
router.patch(
  '/:customerId/notifications/read-all',
  authenticate,
  notificationValidator.customerIdParam,
  notificationController.markAllRead
);

export default router;