import { surveyQuestionOptionRepository, surveyQuestionRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { QUESTION_TYPES, MESSAGES } from '../constants/index.js';

export const surveyQuestionOptionService = {
  listByQuestion(questionId) {
    return surveyQuestionOptionRepository.findByQuestion(questionId);
  },

  async create({ questionId, optionText, sortOrder }) {
    const question = await surveyQuestionRepository.findById(questionId);
    if (!question) throw new NotFoundError(MESSAGES.NOT_FOUND.QUESTION);
    if (question.questionType !== QUESTION_TYPES.SINGLE_CHOICE) {
      throw new ValidationError('Chỉ câu hỏi trắc nghiệm (SINGLE_CHOICE) mới có lựa chọn.');
    }
    if (!optionText?.trim()) throw new ValidationError('Nội dung lựa chọn không được để trống.');

    return surveyQuestionOptionRepository.create({
      questionId,
      optionText: optionText.trim(),
      sortOrder,
    });
  },

  async update(optionId, { optionText, sortOrder }) {
    const existed = await surveyQuestionOptionRepository.findById(optionId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.OPTION);
    if (optionText !== undefined && !optionText.trim()) {
      throw new ValidationError('Nội dung lựa chọn không được để trống.');
    }
    return surveyQuestionOptionRepository.update(optionId, { optionText: optionText?.trim(), sortOrder });
  },

  /** An toàn để xóa: survey_answers.option_id là SET NULL, không bị FK chặn. */
  async remove(optionId) {
    const existed = await surveyQuestionOptionRepository.findById(optionId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.OPTION);
    return surveyQuestionOptionRepository.remove(optionId);
  },
};

export default surveyQuestionOptionService;
