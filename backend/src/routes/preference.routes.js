/**
 * /api/preferences — sửa/xóa 1 sở thích theo preference_id.
 * Việc LIỆT KÊ và THÊM sở thích nằm ở customer.routes.js
 * (/api/customers/:customerId/preferences) vì cần biết thuộc khách hàng nào.
 */
import { Router } from 'express';
import { customerPreferenceController } from '../controllers/index.js';
import { customerPreferenceValidator } from '../validators/index.js';
import { authenticate } from '../middleware/index.js';

const router = Router();

router.put(
  '/:id',
  authenticate,
  customerPreferenceValidator.idParam,
  customerPreferenceValidator.save,
  customerPreferenceController.update
);
router.delete(
  '/:id',
  authenticate,
  customerPreferenceValidator.idParam,
  customerPreferenceController.remove
);

export default router;
