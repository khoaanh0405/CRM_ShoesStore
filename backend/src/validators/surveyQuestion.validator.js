import { validateBody, validateParams } from './common.validator.js';
import { QUESTION_TYPE_LIST } from '../constants/index.js';

export const surveyQuestionValidator = {
  idParam: validateParams('id'),
  surveyIdParam: validateParams('surveyId'),

  create: validateBody({
    surveyId: { required: true, type: 'int', min: 1 },
    questionContent: { required: true, type: 'string' },
    questionType: { required: true, type: 'string', enum: QUESTION_TYPE_LIST },
    // Bắt buộc >=2 lựa chọn khi là SINGLE_CHOICE do Service kiểm tra (phụ
    // thuộc giá trị questionType nên không diễn đạt được bằng rule tĩnh).
    options: { type: 'array', itemType: 'string' },
  }),

  update: validateBody({
    questionContent: { type: 'string' },
    questionType: { type: 'string', enum: QUESTION_TYPE_LIST },
  }),
};

export default surveyQuestionValidator;
