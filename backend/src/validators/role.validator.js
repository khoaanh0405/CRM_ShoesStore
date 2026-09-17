import { validateBody, validateParams } from './common.validator.js';

export const roleValidator = {
  idParam: validateParams('id'),

  create: validateBody({
    roleName: { required: true, type: 'string', maxLength: 50 },
    description: { type: 'string', maxLength: 255 },
  }),

  /** Update cho phép gửi thiếu trường (partial update) nên không required. */
  update: validateBody({
    roleName: { type: 'string', maxLength: 50 },
    description: { type: 'string', maxLength: 255 },
  }),
};

export default roleValidator;
