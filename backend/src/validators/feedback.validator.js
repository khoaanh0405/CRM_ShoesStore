import { validateBody, validateParams } from './common.validator.js';
import { FEEDBACK_RATING } from '../constants/index.js';

export const feedbackValidator = {
  idParam: validateParams('id'),
  customerIdParam: validateParams('customerId'),
  productIdParam: validateParams('productId'),

  // Validator chỉ kiểm tra HÌNH DẠNG dữ liệu. Độ dài/nội dung của content do
  // contentModerationService kiểm tra để trả thông báo thân thiện cho khách hàng.
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
};

export default feedbackValidator;
