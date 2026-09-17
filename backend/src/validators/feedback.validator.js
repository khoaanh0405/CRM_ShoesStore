import { validateBody, validateParams } from './common.validator.js';
import { FEEDBACK_STATUS_LIST, FEEDBACK_RATING } from '../constants/index.js';

export const feedbackValidator = {
  idParam: validateParams('id'),
  customerIdParam: validateParams('customerId'),
  productIdParam: validateParams('productId'),

  create: validateBody({
    customerId: { required: true, type: 'int', min: 1 },
    productId: { required: true, type: 'int', min: 1 },
    title: { required: true, type: 'string', maxLength: 150 },
    content: { required: true, type: 'string' },
    // Khớp đúng CHECK (rating BETWEEN 1 AND 5) ở tầng DB.
    rating: { required: true, type: 'int', min: FEEDBACK_RATING.MIN, max: FEEDBACK_RATING.MAX },
    imageUrl: { type: 'string', maxLength: 500 },
  }),

  update: validateBody({
    title: { type: 'string', maxLength: 150 },
    content: { type: 'string' },
    rating: { type: 'int', min: FEEDBACK_RATING.MIN, max: FEEDBACK_RATING.MAX },
    imageUrl: { type: 'string', maxLength: 500 },
  }),

  updateStatus: validateBody({
    status: { required: true, type: 'string', enum: FEEDBACK_STATUS_LIST },
  }),
};

export default feedbackValidator;
