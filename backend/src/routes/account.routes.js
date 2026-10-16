/**
 * /api/accounts — đăng ký, đăng nhập, quên mật khẩu (OTP), khóa/mở khóa, phân quyền, hồ sơ nhân viên.
 * Path chữ (/register, /login, /me...) khai TRƯỚC /:id.
 */
import { Router } from 'express';
import { accountController, employeeController } from '../controllers/index.js';
import { accountValidator } from '../validators/index.js';
import { validateBody } from '../validators/common.validator.js';
import { authenticate, adminOnly, staffOnly, rateLimit } from '../middleware/index.js';

const router = Router();

// --- Public ---
router.post('/register', accountValidator.register, accountController.register);
router.post('/login', accountValidator.login, accountController.login);
router.post('/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Bạn yêu cầu mã OTP quá nhiều lần.' }), accountValidator.forgotPassword, accountController.forgotPassword);
router.post('/verify-otp', rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: 'Bạn nhập mã OTP quá nhiều lần.' }), accountValidator.verifyOtp, accountController.verifyOtp);
router.post('/reset-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Bạn thử đặt lại mật khẩu quá nhiều lần.' }), accountValidator.resetPassword, accountController.resetPassword);

// --- Cần đăng nhập ---
router.get('/me', authenticate, accountController.me);

// Hồ sơ Employee của Admin/Manager đang đăng nhập (phải đứng trước /:id)
// Hồ sơ nhân viên của Admin/Manager đang đăng nhập
router.get('/me/profile', staffOnly, employeeController.getMe);

router.put(
  '/me/profile',
  staffOnly,
  validateBody({
    fullName: { required: true, type: 'string', maxLength: 100 },
    email: { required: true, type: 'string', maxLength: 100 },
    phone: { type: 'string', maxLength: 20 },
    gender: { type: 'string', maxLength: 10 },
    dateOfBirth: { type: 'date' },
    address: { type: 'string', maxLength: 255 },
  }),
  employeeController.updateMe
);

router.patch('/:id/password', authenticate, accountValidator.idParam, accountValidator.changePassword, accountController.changePassword);

// --- Quản trị ---
router.get('/', adminOnly, accountController.list);
router.get('/:id', adminOnly, accountValidator.idParam, accountController.getById);
router.patch('/:id/lock', staffOnly, accountValidator.idParam, accountController.lock);
router.patch('/:id/unlock', staffOnly, accountValidator.idParam, accountController.unlock);
router.patch('/:id/role', adminOnly, accountValidator.idParam, accountValidator.updateRole, accountController.updateRole);

export default router;
