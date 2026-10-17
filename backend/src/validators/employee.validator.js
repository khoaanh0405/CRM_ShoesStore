import { validateBody } from './common.validator.js';
import { EMAIL_MAX_LENGTH } from '../utils/validation.util.js';

export const employeeValidator = {
  /**
   * Nhân sự (Admin/Manager) tự sửa hồ sơ của mình — mọi trường đều optional (partial update).
   * `position` KHÔNG nằm ở đây vì do Admin quyết định, nhân sự không được tự sửa.
   * Định dạng email và việc họ/tên không được rỗng do Service kiểm tra.
   */
  updateMe: validateBody({
    firstName: { type: 'string', maxLength: 50 },
    lastName: { type: 'string', maxLength: 50 },
    dateOfBirth: { type: 'date' },
    gender: { type: 'string', maxLength: 10 },
    phone: { type: 'string', maxLength: 20 },
    email: { type: 'string', maxLength: EMAIL_MAX_LENGTH },
    address: { type: 'string', maxLength: 255 },
  }),
};

export default employeeValidator;
