import { validateBody, validateParams } from './common.validator.js';

export const customerPreferenceValidator = {
  idParam: validateParams('id'),
  customerIdParam: validateParams('customerId'),

  /** Sở thích chỉ được chọn từ danh mục có sẵn -> chỉ nhận categoryId. */
  save: validateBody({
    categoryId: { required: true, type: 'int', min: 1 },
  }),
};

export default customerPreferenceValidator;
