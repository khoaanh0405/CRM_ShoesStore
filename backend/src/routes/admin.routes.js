import { Router } from 'express';
import { accountController, adminController } from '../controllers/index.js';
import { accountValidator } from '../validators/index.js';
import { adminOnly, staffOnly } from '../middleware/index.js';

const router = Router();

// Thêm khách hàng: cả Admin lẫn Manager (giao diện chính nằm ở phía Manager).
router.post(
  '/customers',
  staffOnly,
  accountValidator.createCustomerByAdmin,
  accountController.createCustomerByAdmin
);

// Thêm tài khoản nội bộ (Admin/Manager): chỉ Admin.
router.post('/staff', adminOnly, accountValidator.createStaff, accountController.createStaff);

// staffOnly = authorize(ADMIN, MANAGER): cho phép CẢ Admin lẫn Manager.
router.get('/stats', staffOnly, adminController.getDashboardStats);
router.get('/online-count', staffOnly, adminController.getOnlineCount);

export default router;
