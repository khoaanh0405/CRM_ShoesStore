import { validateBody, validateParams } from './common.validator.js';

export const supplierValidator = {
  idParam: validateParams('id'),

  create: validateBody({
    supplierName: { required: true, type: 'string', maxLength: 150 },
    phone: { type: 'string', maxLength: 20 },
    email: { type: 'string', maxLength: 100 },
    address: { type: 'string', maxLength: 255 },
  }),

  update: validateBody({
    supplierName: { type: 'string', maxLength: 150 },
    phone: { type: 'string', maxLength: 20 },
    email: { type: 'string', maxLength: 100 },
    address: { type: 'string', maxLength: 255 },
  }),
};

export default supplierValidator;
