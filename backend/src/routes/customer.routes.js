/**
 * /api/customers — khách hàng và các resource con (sở thích, phản hồi,
 * khảo sát được gán, bài đã nộp, thông báo).
 *
 * DELETE /:id là SOFT DELETE (customerService.remove -> softDelete), dữ liệu
 * Feedback/SurveyResponse vẫn được giữ nguyên.
 *
 * PUT /:id chỉ cần authenticate (không adminOnly) vì khách hàng được tự sửa
 * hồ sơ của mình — customerController đọc req.user.customerId truyền xuống
 * Service làm requesterId để chặn sửa hồ sơ người khác.
 */
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
import { authenticate, adminOnly } from '../middleware/index.js';
const router = Router();
// Các path chữ khai TRƯỚC /:id.
router.get('/report', adminOnly, customerController.report);
router.get('/search', adminOnly, customerController.search);
router.get('/', adminOnly, customerController.list);
router.get('/:id', authenticate, customerValidator.idParam, customerController.getById);
router.get('/:id/profile', authenticate, customerValidator.idParam, customerController.getProfile);
router.put(
  '/:id',
  authenticate,
  customerValidator.idParam,
  customerValidator.updateProfile,
  customerController.updateProfile
);
router.delete('/:id', adminOnly, customerValidator.idParam, customerController.remove);
// --- Resource con: sở thích ---
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
// --- Resource con: phản hồi đã gửi ---
router.get(
  '/:customerId/feedbacks',
  authenticate,
  feedbackValidator.customerIdParam,
  feedbackController.listByCustomer
);
// --- Resource con: khảo sát được gán / bài đã nộp ---
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
// --- Resource con: thông báo (chuông thông báo phía khách hàng) ---
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
