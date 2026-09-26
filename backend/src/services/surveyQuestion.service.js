import {
  surveyQuestionRepository,
  surveyRepository,
  surveyQuestionOptionRepository,
  surveyTargetRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { QUESTION_TYPE_LIST, MESSAGES } from '../constants/index.js';
import { isForeignKeyError } from '../utils/index.js';

/** Chặn sửa/xoá/thêm câu hỏi nếu khảo sát đã gửi cho ít nhất 1 khách hàng. */
async function ensureSurveyNotSent(surveyId) {
  const targets = await surveyTargetRepository.findBySurvey(surveyId);
  if (targets.length > 0) {
    throw new ConflictError(
      'Khảo sát này đã được gửi tới khách hàng nên không thể chỉnh sửa câu hỏi. Vui lòng tạo một khảo sát mới nếu cần thay đổi nội dung.'
    );
  }
}

export const surveyQuestionService = {
  listBySurvey(surveyId) {
    return surveyQuestionRepository.findBySurveyWithOptions(surveyId);
  },

  async getById(questionId) {
    const question = await surveyQuestionRepository.findById(questionId);
    if (!question) throw new NotFoundError(MESSAGES.NOT_FOUND.QUESTION);
    return question;
  },

  async create({ surveyId, questionContent, questionType, options = [] }) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);
    await ensureSurveyNotSent(surveyId);

    if (!questionContent?.trim()) throw new ValidationError('Nội dung câu hỏi không được để trống.');
    if (!QUESTION_TYPE_LIST.includes(questionType)) {
      throw new ValidationError(`Loại câu hỏi không hợp lệ: "${questionType}".`);
    }

    const question = await surveyQuestionRepository.create({
      surveyId,
      questionContent: questionContent.trim(),
      questionType,
    });

    if (questionType === 'SINGLE_CHOICE' && Array.isArray(options) && options.length > 0) {
      await Promise.all(
        options.map((optionText, idx) =>
          surveyQuestionOptionRepository.create({
            questionId: question.questionId,
            optionText: optionText.trim(),
            sortOrder: idx,
          })
        )
      );
    }

    return surveyQuestionRepository.findById(question.questionId);
  },

  async update(questionId, { questionContent, questionType }) {
    const question = await this.getById(questionId);
    await ensureSurveyNotSent(question.surveyId);
    if (questionContent !== undefined && !questionContent.trim()) {
      throw new ValidationError('Nội dung câu hỏi không được để trống.');
    }
    if (questionType !== undefined && !QUESTION_TYPE_LIST.includes(questionType)) {
      throw new ValidationError(`Loại câu hỏi không hợp lệ: "${questionType}".`);
    }
    return surveyQuestionRepository.update(questionId, {
      questionContent: questionContent?.trim(),
      questionType,
    });
  },

  async remove(questionId) {
    const question = await this.getById(questionId);
    await ensureSurveyNotSent(question.surveyId);
    try {
      return await surveyQuestionRepository.remove(questionId);
    } catch (err) {
      if (isForeignKeyError(err)) {
        throw new ConflictError('Không thể xóa câu hỏi vì đã có khách hàng trả lời.');
      }
      throw err;
    }
  },
};

export default surveyQuestionService;