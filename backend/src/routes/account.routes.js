/**
 * /api/accounts — đăng ký, đăng nhập, quên mật khẩu (OTP email), khóa/mở khóa, phân quyền.
 *
 * /register, /login, /forgot-password, /reset-password là các endpoint CÔNG KHAI
 * (không gắn auth) — vì người dùng chưa có token. Các route còn lại đều yêu
 * cầu đăng nhập.
 *
 * Lưu ý thứ tự: các path chữ (/register, /login...) khai TRƯỚC /:id để Express
 * không hiểu nhầm là giá trị của tham số :id.
 */
import { Router } from 'express';
import { accountController } from '../controllers/index.js';
import { accountValidator } from '../validators/index.js';
import { authenticate, adminOnly, staffOnly, rateLimit } from '../middleware/index.js';

const router = Router();

// --- Public ---
router.post('/register', accountValidator.register, accountController.register);
router.post('/login', accountValidator.login, accountController.login);

// Quên mật khẩu: giới hạn theo IP để tránh spam email / dò OTP.
router.post(
  '/forgot-password',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Bạn yêu cầu mã OTP quá nhiều lần.' }),
  accountValidator.forgotPassword,
  accountController.forgotPassword
);
router.post(
  '/verify-otp',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: 'Bạn nhập mã OTP quá nhiều lần.' }),
  accountValidator.verifyOtp,
  accountController.verifyOtp
);
router.post(
  '/reset-password',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Bạn thử đặt lại mật khẩu quá nhiều lần.' }),
  accountValidator.resetPassword,
  accountController.resetPassword
);

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
router.patch('/:id/lock', staffOnly, accountValidator.idParam, accountController.lock);
router.patch('/:id/unlock', staffOnly, accountValidator.idParam, accountController.unlock);
router.patch(
  '/:id/role',
  adminOnly,
  accountValidator.idParam,
  accountValidator.updateRole,
  accountController.updateRole
);

export default router;
