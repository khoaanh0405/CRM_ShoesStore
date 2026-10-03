import { validateBody, validateParams } from './common.validator.js';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, OTP_LENGTH, ROLE_NAMES } from '../constants/index.js';
import { EMAIL_MAX_LENGTH, isValidEmail } from '../utils/validation.util.js';
import { ValidationError } from '../errors/AppError.js';

/** Kiểm tra định dạng email trong body (rule tĩnh của validateBody không có regex). */
function validateEmailFormat(req, res, next) {
  if (!isValidEmail(req.body?.email)) return next(new ValidationError('Email không hợp lệ.'));
  next();
}

/** OTP phải đúng OTP_LENGTH chữ số. */
function validateOtpFormat(req, res, next) {
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(String(req.body?.otp ?? ''))) {
    return next(new ValidationError(`Mã OTP gồm ${OTP_LENGTH} chữ số.`));
  }
  next();
}

const CUSTOMER_FIELDS = {
  username: { required: true, type: 'string', maxLength: 50 },
  password: { required: true, type: 'string', minLength: MIN_PASSWORD_LENGTH, maxLength: MAX_PASSWORD_LENGTH },
  fullName: { required: true, type: 'string', maxLength: 100 },
  email: { required: true, type: 'string', maxLength: EMAIL_MAX_LENGTH },
  dateOfBirth: { required: true, type: 'date' },
  gender: { type: 'string', maxLength: 10 },
  phone: { type: 'string', maxLength: 20 },
  address: { type: 'string', maxLength: 255 },
};

export const accountValidator = {
  idParam: validateParams('id'),

  /** Đăng ký khách hàng: tạo Account + Customer cùng lúc nên validate cả 2 nhóm trường (email bắt buộc). */
  register: [validateBody(CUSTOMER_FIELDS), validateEmailFormat],

  /** Staff (Admin/Manager) thêm khách hàng mới (POST /api/admin/customers). */
  createCustomerByAdmin: [validateBody(CUSTOMER_FIELDS), validateEmailFormat],

  /** Admin thêm tài khoản nội bộ (POST /api/admin/staff) — chỉ Admin hoặc Manager, không có hồ sơ khách hàng. */
  createStaff: [
    validateBody({
      username: { required: true, type: 'string', maxLength: 50 },
      email: { required: true, type: 'string', maxLength: EMAIL_MAX_LENGTH },
      password: { required: true, type: 'string', maxLength: MAX_PASSWORD_LENGTH },
      roleName: { required: true, type: 'string', enum: [ROLE_NAMES.ADMIN, ROLE_NAMES.MANAGER] },
    }),
    validateEmailFormat,
  ],

  login: validateBody({
    username: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),

  changePassword: validateBody({
    oldPassword: { required: true, type: 'string' },
    newPassword: { required: true, type: 'string', minLength: MIN_PASSWORD_LENGTH, maxLength: MAX_PASSWORD_LENGTH },
  }),

  /** Bước 1 quên mật khẩu: nhập email để nhận OTP. */
  forgotPassword: [
    validateBody({ email: { required: true, type: 'string', maxLength: EMAIL_MAX_LENGTH } }),
    validateEmailFormat,
  ],

  /** Bước 2 quên mật khẩu: kiểm tra OTP. */
  verifyOtp: [
    validateBody({
      email: { required: true, type: 'string', maxLength: EMAIL_MAX_LENGTH },
      otp: { required: true, type: 'string' },
    }),
    validateEmailFormat,
    validateOtpFormat,
  ],

  /** Bước 3 quên mật khẩu: email + OTP + mật khẩu mới (độ mạnh do Service kiểm tra). */
  resetPassword: [
    validateBody({
      email: { required: true, type: 'string', maxLength: EMAIL_MAX_LENGTH },
      otp: { required: true, type: 'string' },
      newPassword: { required: true, type: 'string', maxLength: MAX_PASSWORD_LENGTH },
    }),
    validateEmailFormat,
    validateOtpFormat,
  ],

  /** PATCH /accounts/:id/role, body { roleName }. */
  updateRole: validateBody({
    roleName: { required: true, type: 'string', maxLength: 50 },
  }),
};

export default accountValidator;
