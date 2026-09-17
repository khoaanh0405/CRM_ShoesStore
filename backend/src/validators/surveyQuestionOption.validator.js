import { validateBody, validateParams } from './common.validator.js';

export const surveyQuestionOptionValidator = {
  idParam: validateParams('id'),
  questionIdParam: validateParams('questionId'),

  create: validateBody({
    questionId: { required: true, type: 'int', min: 1 },
    optionText: { required: true, type: 'string', maxLength: 255 },
    sortOrder: { type: 'int', min: 0 },
  }),

  update: validateBody({
    optionText: { type: 'string', maxLength: 255 },
    sortOrder: { type: 'int', min: 0 },
  }),
};

export default surveyQuestionOptionValidator;
