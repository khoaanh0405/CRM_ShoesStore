import { validateBody, validateParams } from './common.validator.js';
import { ValidationError } from '../errors/AppError.js';

/**
 * Kiểm tra hình dạng từng phần tử trong mảng answers — rule tĩnh của
 * validateBody không mô tả được mảng object lồng nhau nên viết tay ở đây.
 * Vẫn chỉ là check HÌNH DẠNG: questionId phải là số, answerValue không rỗng.
 * Việc "câu hỏi có thuộc khảo sát không", "đã trả lời đủ chưa" thuộc Service.
 */
function validateAnswerItems(req, res, next) {
  const { answers } = req.body ?? {};
  const errors = [];

  answers.forEach((answer, index) => {
    const position = index + 1;
    if (answer === null || typeof answer !== 'object' || Array.isArray(answer)) {
      errors.push(`Câu trả lời thứ ${position} phải là một object.`);
      return;
    }
    if (!Number.isInteger(Number(answer.questionId)) || Number(answer.questionId) <= 0) {
      errors.push(`Câu trả lời thứ ${position} thiếu "questionId" hợp lệ.`);
    }
    if (answer.answerValue === undefined || answer.answerValue === null || !String(answer.answerValue).trim()) {
      errors.push(`Câu trả lời thứ ${position} thiếu "answerValue".`);
    }
    if (answer.optionId !== undefined && answer.optionId !== null
      && (!Number.isInteger(Number(answer.optionId)) || Number(answer.optionId) <= 0)) {
      errors.push(`Câu trả lời thứ ${position} có "optionId" không hợp lệ.`);
    }
  });

  if (errors.length) return next(new ValidationError(errors.join(' ')));
  next();
}

export const surveyResponseValidator = {
  idParam: validateParams('id'),
  surveyIdParam: validateParams('surveyId'),
  customerIdParam: validateParams('customerId'),
  responseIdParam: validateParams('responseId'),

  /** Dùng như mảng middleware: chạy check mảng trước, rồi check từng phần tử. */
  submit: [
    validateBody({
      customerId: { required: true, type: 'int', min: 1 },
      answers: { required: true, type: 'array', minItems: 1 },
    }),
    validateAnswerItems,
  ],
};

export default surveyResponseValidator;
