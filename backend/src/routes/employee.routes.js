/**
 * /api/employees — hồ sơ nhân sự nội bộ (Admin/Manager).
 * Khai /me TRƯỚC các path có tham số để Express không hiểu nhầm "me" là :id.
 */
import { Router } from 'express';
import { employeeController } from '../controllers/index.js';
import { adminOnly, staffOnly } from '../middleware/index.js';
import { employeeValidator } from '../validators/employee.validator.js';

const router = Router();

router.get('/me', staffOnly, employeeController.getMe);
router.put('/me', staffOnly, employeeValidator.updateMe, employeeController.updateMe);

router.get('/', adminOnly, employeeController.list);

export default router;
