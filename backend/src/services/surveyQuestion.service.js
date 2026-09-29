import {
  surveyQuestionRepository,
  surveyRepository,
  surveyQuestionOptionRepository,
  surveyResponseRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { QUESTION_TYPE_LIST, MESSAGES } from '../constants/index.js';
import { isForeignKeyError } from '../utils/index.js';

/**
 * Chỉ chặn sửa/xóa/thêm câu hỏi khi đã có khách hàng NỘP BÀI (sửa sẽ làm sai
 * lệch kết quả). Khảo sát mới chỉ "gửi" mà chưa ai nộp thì vẫn được chỉnh sửa.
 */
async function ensureNoResponses(surveyId) {
  const responses = await surveyResponseRepository.findBySurvey(surveyId);
  if (responses.length > 0) {
    throw new ConflictError(
      'Khảo sát này đã có khách hàng nộp bài nên không thể chỉnh sửa câu hỏi. Vui lòng tạo khảo sát mới nếu cần thay đổi nội dung.'
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
    await ensureNoResponses(surveyId);

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
    await ensureNoResponses(question.surveyId);
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
    await ensureNoResponses(question.surveyId);
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
