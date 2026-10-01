/**
 * /api/notifications — thao tác trên 1 thông báo cụ thể.
 * Việc LIỆT KÊ / đếm chưa đọc / đánh dấu tất cả đã đọc nằm ở customer.routes.js
 * (/api/customers/:customerId/notifications...) vì cần biết thuộc khách hàng nào.
 */
import { Router } from 'express';
import { notificationController } from '../controllers/index.js';
import { notificationValidator } from '../validators/index.js';
import { authenticate } from '../middleware/index.js';
const router = Router();
router.patch(
  '/:id/read',
  authenticate,
  notificationValidator.idParam,
  notificationController.markRead
);
export default router;
