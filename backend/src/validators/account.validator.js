import { validateBody, validateParams } from './common.validator.js';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH, ROLE_NAMES } from '../constants/index.js';
import { EMAIL_MAX_LENGTH, assertStrictEmail } from '../utils/validation.util.js';

/** Email đăng ký/tạo mới: @gmail.com và có ít nhất 1 chữ số (xem assertStrictEmail). */
function validateStrictEmail(req, res, next) {
  try {
    assertStrictEmail(req.body?.email);
    next();
  } catch (e) {
    next(e);
  }
}

const CUSTOMER_FIELDS = {
  username: { required: true, type: 'string', maxLength: 50 },
  password: { required: true, type: 'string', minLength: MIN_PASSWORD_LENGTH, maxLength: MAX_PASSWORD_LENGTH },
  lastName: { required: true, type: 'string', maxLength: 50 },
  firstName: { required: true, type: 'string', maxLength: 50 },
  email: { required: true, type: 'string', maxLength: EMAIL_MAX_LENGTH },
  dateOfBirth: { required: true, type: 'date' },
  gender: { type: 'string', maxLength: 10 },
  phone: { type: 'string', maxLength: 20 },
  address: { type: 'string', maxLength: 255 },
};

export const accountValidator = {
  idParam: validateParams('id'),

  /** Đăng ký khách hàng: tạo Account + Customer cùng lúc nên validate cả 2 nhóm trường (email bắt buộc). */
  register: [validateBody(CUSTOMER_FIELDS), validateStrictEmail],

  /** Staff (Admin/Manager) thêm khách hàng mới (POST /api/admin/customers). */
  createCustomerByAdmin: [validateBody(CUSTOMER_FIELDS), validateStrictEmail],

  /** Admin thêm tài khoản nội bộ (POST /api/admin/staff) — chỉ Admin hoặc Manager, không có hồ sơ khách hàng. */
  createStaff: [
    validateBody({
      username: { required: true, type: 'string', maxLength: 50 },
      lastName: { required: true, type: 'string', maxLength: 50 },
      firstName: { required: true, type: 'string', maxLength: 50 },
      email: { required: true, type: 'string', maxLength: EMAIL_MAX_LENGTH },
      password: { required: true, type: 'string', maxLength: MAX_PASSWORD_LENGTH },
      roleName: { required: true, type: 'string', enum: [ROLE_NAMES.ADMIN, ROLE_NAMES.MANAGER] },
      dateOfBirth: { type: 'date' },
      gender: { type: 'string', maxLength: 10 },
      phone: { type: 'string', maxLength: 20 },
      address: { type: 'string', maxLength: 255 },
      position: { type: 'string', maxLength: 100 },
    }),
    validateStrictEmail,
  ],

  login: validateBody({
    username: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),

  changePassword: validateBody({
    oldPassword: { required: true, type: 'string' },
    newPassword: { required: true, type: 'string', minLength: MIN_PASSWORD_LENGTH, maxLength: MAX_PASSWORD_LENGTH },
  }),

  /** PATCH /accounts/:id/role, body { roleName }. */
  updateRole: validateBody({
    roleName: { required: true, type: 'string', maxLength: 50 },
  }),
};

export default accountValidator;
