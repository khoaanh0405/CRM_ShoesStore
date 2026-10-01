import { validateBody, validateParams } from './common.validator.js';
import { MIN_PASSWORD_LENGTH } from '../constants/index.js';

export const accountValidator = {
  idParam: validateParams('id'),

  /** Đăng ký khách hàng: tạo Account + Customer cùng lúc nên validate cả 2 nhóm trường. */
  register: validateBody({
    username: { required: true, type: 'string', maxLength: 50 },
    password: { required: true, type: 'string', minLength: MIN_PASSWORD_LENGTH },
    fullName: { required: true, type: 'string', maxLength: 100 },
    dateOfBirth: { required: true, type: 'date' },
    gender: { type: 'string', maxLength: 10 },
    phone: { type: 'string', maxLength: 20 },
    address: { type: 'string', maxLength: 255 },
  }),

  /**
   * Admin thêm khách hàng mới (mục 4.1.1, POST /api/admin/customers) — cùng
   * hình dạng dữ liệu với register vì đều tạo Account+Customer, chỉ khác
   * người gọi (Admin) và ý nghĩa của `password` (mật khẩu khởi tạo do Admin
   * nhập hộ, không phải khách hàng tự đặt).
   */
  createCustomerByAdmin: validateBody({
    username: { required: true, type: 'string', maxLength: 50 },
    password: { required: true, type: 'string', minLength: MIN_PASSWORD_LENGTH },
    fullName: { required: true, type: 'string', maxLength: 100 },
    dateOfBirth: { required: true, type: 'date' },
    gender: { type: 'string', maxLength: 10 },
    phone: { type: 'string', maxLength: 20 },
    address: { type: 'string', maxLength: 255 },
  }),

  login: validateBody({
    username: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),

  changePassword: validateBody({
    oldPassword: { required: true, type: 'string' },
    newPassword: { required: true, type: 'string', minLength: MIN_PASSWORD_LENGTH },
  }),

  /**
   * Khớp với AccountManagement.tsx (PATCH /accounts/:id/role, body
   * { roleName }) — không phải { roleId }. accountService.updateRole tự tra
   * roleId tương ứng từ roleName này.
   */
  updateRole: validateBody({
    roleName: { required: true, type: 'string', maxLength: 50 },
  }),
};

export default accountValidator;