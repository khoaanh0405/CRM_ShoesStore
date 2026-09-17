import { validateBody, validateParams } from './common.validator.js';

export const customerValidator = {
  idParam: validateParams('id'),

  /** Khách hàng sửa hồ sơ — mọi trường đều optional (partial update). */
  updateProfile: validateBody({
    fullName: { type: 'string', maxLength: 100 },
    dateOfBirth: { type: 'date' },
    gender: { type: 'string', maxLength: 10 },
    phone: { type: 'string', maxLength: 20 },
    address: { type: 'string', maxLength: 255 },
  }),
};

export default customerValidator;
