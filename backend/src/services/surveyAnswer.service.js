/**
 * Service cho SurveyAnswer. statsByQuestion() là phần lõi phục vụ mục 4.1.7
 * "Thống kê kết quả khảo sát": câu SINGLE_CHOICE đếm số lượt chọn theo từng
 * option (kèm optionText để hiển thị), câu TEXT trả về nguyên văn các câu
 * trả lời vì không có option để group-by (đúng ghi chú trong
 * surveyAnswer.repository.js).
 */
import {
  surveyAnswerRepository,
  surveyQuestionRepository,
  surveyQuestionOptionRepository,
} from '../repositories/index.js';
import { NotFoundError } from '../errors/AppError.js';

export const surveyAnswerService = {
  listByResponse(responseId) {
    return surveyAnswerRepository.findByResponse(responseId);
  },

  listByQuestion(questionId) {
    return surveyAnswerRepository.findByQuestion(questionId);
  },

  async statsByQuestion(questionId) {
    const question = await surveyQuestionRepository.findById(questionId);
    if (!question) throw new NotFoundError('Không tìm thấy câu hỏi.');

    if (question.questionType === 'TEXT') {
      const answers = await surveyAnswerRepository.findByQuestion(questionId);
      return {
        questionId,
        questionContent: question.questionContent,
        questionType: 'TEXT',
        totalAnswers: answers.length,
        answers: answers.map((a) => a.answerValue),
      };
    }

    const [options, grouped] = await Promise.all([
      surveyQuestionOptionRepository.findByQuestion(questionId),
      surveyAnswerRepository.countByQuestionOption(questionId),
    ]);

    const countByOptionId = new Map(grouped.map((g) => [g.optionId, g._count._all]));

    return {
      questionId,
      questionContent: question.questionContent,
      questionType: question.questionType,
      totalAnswers: grouped.reduce((sum, g) => sum + g._count._all, 0),
      options: options.map((option) => ({
        optionId: option.optionId,
        optionText: option.optionText,
        count: countByOptionId.get(option.optionId) || 0,
      })),
    };
  },

  /** Thống kê toàn bộ khảo sát — gộp statsByQuestion() cho mọi câu hỏi. */
  async statsBySurvey(surveyId) {
    const questions = await surveyQuestionRepository.findBySurvey(surveyId);
    return Promise.all(questions.map((q) => this.statsByQuestion(q.questionId)));
  },
};

export default surveyAnswerService;
