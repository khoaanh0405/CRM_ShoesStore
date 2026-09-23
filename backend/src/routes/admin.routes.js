import { Router } from 'express';
import { accountController, adminController } from '../controllers/index.js';
import { accountValidator } from '../validators/index.js';
import { staffOnly } from '../middleware/index.js';

const router = Router();

router.post(
  '/customers',
  staffOnly,
  accountValidator.createCustomerByAdmin,
  accountController.createCustomerByAdmin
);

// staffOnly = authorize(ADMIN, MANAGER) trong auth.middleware.js, tức middleware
// cho phép CẢ Admin lẫn Manager — đây mới là middleware đúng để dùng cho những
// route cần cả 2 role cùng truy cập. "managerOnly" chỉ authorize đúng role
// Manager (KHÔNG bao gồm Admin) nên dùng nó ở đây sẽ luôn chặn Admin, và cũng
// sẽ chặn Manager nếu tài khoản test thực chất mang role Admin.
router.get('/stats', staffOnly, adminController.getDashboardStats);

export default router;