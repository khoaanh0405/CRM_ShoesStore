import { validateBody, validateParams } from './common.validator.js';

export const customerPreferenceValidator = {
  idParam: validateParams('id'),
  customerIdParam: validateParams('customerId'),

  save: validateBody({
    preferenceTag: { required: true, type: 'string', maxLength: 100 },
  }),
};

export default customerPreferenceValidator;
