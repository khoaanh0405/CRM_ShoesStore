import { surveyQuestionOptionRepository, surveyQuestionRepository, surveyTargetRepository } from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { QUESTION_TYPES, MESSAGES } from '../constants/index.js';

async function ensureSurveyNotSent(surveyId) {
  const targets = await surveyTargetRepository.findBySurvey(surveyId);
  if (targets.length > 0) {
    throw new ConflictError(
      'Khảo sát này đã được gửi tới khách hàng nên không thể chỉnh sửa lựa chọn. Vui lòng tạo một khảo sát mới nếu cần thay đổi.'
    );
  }
}

export const surveyQuestionOptionService = {
  listByQuestion(questionId) {
    return surveyQuestionOptionRepository.findByQuestion(questionId);
  },

  async create({ questionId, optionText, sortOrder }) {
    const question = await surveyQuestionRepository.findById(questionId);
    if (!question) throw new NotFoundError(MESSAGES.NOT_FOUND.QUESTION);
    await ensureSurveyNotSent(question.surveyId);
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
    const question = await surveyQuestionRepository.findById(existed.questionId);
    await ensureSurveyNotSent(question.surveyId);
    if (optionText !== undefined && !optionText.trim()) {
      throw new ValidationError('Nội dung lựa chọn không được để trống.');
    }
    return surveyQuestionOptionRepository.update(optionId, { optionText: optionText?.trim(), sortOrder });
  },

  async remove(optionId) {
    const existed = await surveyQuestionOptionRepository.findById(optionId);
    if (!existed) throw new NotFoundError(MESSAGES.NOT_FOUND.OPTION);
    const question = await surveyQuestionRepository.findById(existed.questionId);
    await ensureSurveyNotSent(question.surveyId);
    return surveyQuestionOptionRepository.remove(optionId);
  },
};

export default surveyQuestionOptionService;