import { validateBody, validateParams } from './common.validator.js';
import { EMAIL_MAX_LENGTH } from '../utils/validation.util.js';

export const customerValidator = {
  idParam: validateParams('id'),

  /** Khách hàng sửa hồ sơ — mọi trường đều optional (partial update). Định dạng email do Service kiểm tra. */
  updateProfile: validateBody({
    fullName: { type: 'string', maxLength: 100 },
    dateOfBirth: { type: 'date' },
    gender: { type: 'string', maxLength: 10 },
    phone: { type: 'string', maxLength: 20 },
    email: { type: 'string', maxLength: EMAIL_MAX_LENGTH },
    address: { type: 'string', maxLength: 255 },
  }),
};

export default customerValidator;
