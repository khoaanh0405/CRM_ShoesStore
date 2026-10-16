/**
 * /api/employees — hồ sơ nhân sự nội bộ (Admin/Manager).
 * Khai /me TRƯỚC các path có tham số để Express không hiểu nhầm "me" là :id.
 */
import { Router } from 'express';
import { employeeController } from '../controllers/index.js';
import { adminOnly, staffOnly } from '../middleware/index.js';
import { validateBody } from '../validators/index.js';
import { EMAIL_MAX_LENGTH } from '../utils/validation.util.js';

const router = Router();

router.get('/me', staffOnly, employeeController.getMe);
router.put(
  '/me',
  staffOnly,
  validateBody({
    fullName: { type: 'string', maxLength: 100 },
    dateOfBirth: { type: 'date' },
    gender: { type: 'string', maxLength: 10 },
    phone: { type: 'string', maxLength: 20 },
    email: { type: 'string', maxLength: EMAIL_MAX_LENGTH },
    address: { type: 'string', maxLength: 255 },
  }),
  employeeController.updateMe
);

router.get('/', adminOnly, employeeController.list);

export default router;
