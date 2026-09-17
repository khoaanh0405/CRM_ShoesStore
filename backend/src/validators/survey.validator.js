import { validateBody, validateParams } from './common.validator.js';
import { MIN_SURVEY_QUESTIONS } from '../constants/index.js';

export const surveyValidator = {
  idParam: validateParams('id'),

  /**
   * Chỉ kiểm tra mảng questions có đủ số lượng tối thiểu và đúng kiểu mảng.
   * Nội dung từng câu hỏi (questionType hợp lệ, SINGLE_CHOICE phải có >=2
   * lựa chọn) do surveyService tự validate — không lặp lại ở đây.
   */
  create: validateBody({
    title: { required: true, type: 'string', maxLength: 200 },
    description: { type: 'string' },
    questions: { required: true, type: 'array', minItems: MIN_SURVEY_QUESTIONS },
  }),

  update: validateBody({
    title: { type: 'string', maxLength: 200 },
    description: { type: 'string' },
  }),

  setActive: validateBody({
    isActive: { required: true, type: 'boolean' },
  }),

  assign: validateBody({
    customerIds: { required: true, type: 'array', minItems: 1, itemType: 'int' },
  }),
};

export default surveyValidator;
