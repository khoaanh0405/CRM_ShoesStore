import {
  surveyQuestionRepository,
  surveyRepository,
  surveyQuestionOptionRepository,
} from '../repositories/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { QUESTION_TYPE_LIST, MESSAGES } from '../constants/index.js';
import { isForeignKeyError } from '../utils/index.js';

export const surveyQuestionService = {
  listBySurvey(surveyId) {
    return surveyQuestionRepository.findBySurveyWithOptions(surveyId);
  },

  async getById(questionId) {
    const question = await surveyQuestionRepository.findById(questionId);
    if (!question) throw new NotFoundError(MESSAGES.NOT_FOUND.QUESTION);
    return question;
  },

  /** Thêm 1 câu hỏi (kèm lựa chọn nếu là SINGLE_CHOICE) vào khảo sát đã tồn tại. */
  async create({ surveyId, questionContent, questionType, options = [] }) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);

    if (!questionContent?.trim()) throw new ValidationError('Nội dung câu hỏi không được để trống.');
    if (!QUESTION_TYPE_LIST.includes(questionType)) {
      throw new ValidationError(`Loại câu hỏi không hợp lệ: "${questionType}".`);
    }
    if (questionType === 'SINGLE_CHOICE' && (!Array.isArray(options) || options.length < 2)) {
      throw new ValidationError('Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn.');
    }

    const question = await surveyQuestionRepository.create({
      surveyId,
      questionContent: questionContent.trim(),
      questionType,
    });

    if (questionType === 'SINGLE_CHOICE') {
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
    await this.getById(questionId);
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

  /** Chỉ nên xóa câu hỏi chưa có ai trả lời — DB tự chặn (RESTRICT) nếu đã có answer. */
  async remove(questionId) {
    await this.getById(questionId);
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
