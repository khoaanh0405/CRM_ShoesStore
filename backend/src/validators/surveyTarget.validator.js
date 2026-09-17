import { validateBody, validateParams } from './common.validator.js';

export const surveyTargetValidator = {
  surveyIdParam: validateParams('surveyId'),
  customerIdParam: validateParams('customerId'),
  /** Endpoint xóa dùng khóa ghép nên cần validate cả 2 param cùng lúc. */
  compositeParams: validateParams('surveyId', 'customerId'),

  assign: validateBody({
    customerId: { required: true, type: 'int', min: 1 },
  }),

  assignMany: validateBody({
    customerIds: { required: true, type: 'array', minItems: 1, itemType: 'int' },
  }),
};

export default surveyTargetValidator;
