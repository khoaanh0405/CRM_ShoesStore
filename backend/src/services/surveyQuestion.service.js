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

  /** Them 1 cau hoi (kem lua chon neu co) vao khao sat da ton tai. */
  async create({ surveyId, questionContent, questionType, options = [] }) {
    const survey = await surveyRepository.findById(surveyId);
    if (!survey) throw new NotFoundError(MESSAGES.NOT_FOUND.SURVEY);

    if (!questionContent?.trim()) throw new ValidationError('Noi dung cau hoi khong duoc de trong.');
    if (!QUESTION_TYPE_LIST.includes(questionType)) {
      throw new ValidationError(`Loai cau hoi khong hop le: "${questionType}".`);
    }
    // Note: Khong bat buoc phai co options khi tao - options co the duoc them sau qua API /options

    const question = await surveyQuestionRepository.create({
      surveyId,
      questionContent: questionContent.trim(),
      questionType,
    });

    if ((questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') && Array.isArray(options) && options.length > 0) {
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
