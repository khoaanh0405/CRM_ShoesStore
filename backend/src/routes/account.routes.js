/**
 * /api/accounts — đăng ký, đăng nhập, khóa/mở khóa, phân quyền.
 *
 * /register và /login là 2 endpoint CÔNG KHAI duy nhất của hệ thống (không
 * gắn auth) — vì người dùng chưa có token thì mới cần đăng nhập. Các route
 * còn lại đều yêu cầu đăng nhập.
 *
 * Lưu ý thứ tự: các path chữ (/register, /login) khai TRƯỚC /:id để Express
 * không hiểu nhầm "register" là giá trị của tham số :id.
 */
import { Router } from 'express';
import { accountController } from '../controllers/index.js';
import { accountValidator } from '../validators/index.js';
import { authenticate, adminOnly } from '../middleware/index.js';

const router = Router();

// --- Public ---
router.post('/register', accountValidator.register, accountController.register);
router.post('/login', accountValidator.login, accountController.login);

// --- Cần đăng nhập ---
router.patch(
  '/:id/password',
  authenticate,
  accountValidator.idParam,
  accountValidator.changePassword,
  accountController.changePassword
);

// --- Chỉ Admin ---
router.get('/', adminOnly, accountController.list);
router.get('/:id', adminOnly, accountValidator.idParam, accountController.getById);
router.patch('/:id/lock', adminOnly, accountValidator.idParam, accountController.lock);
router.patch('/:id/unlock', adminOnly, accountValidator.idParam, accountController.unlock);
router.patch(
  '/:id/role',
  adminOnly,
  accountValidator.idParam,
  accountValidator.updateRole,
  accountController.updateRole
);

export default router;
