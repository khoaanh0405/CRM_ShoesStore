/**
 * Service cho SurveyAnswer. statsByQuestion() là phần lõi phục vụ mục 4.1.7
 * "Thống kê kết quả khảo sát": câu SINGLE_CHOICE đếm số lượt chọn theo từng
 * option (kèm optionText để hiển thị), câu TEXT trả về nguyên văn các câu
 * trả lời vì không có option để group-by (đúng ghi chú trong
 * surveyAnswer.repository.js).
 */
import prisma from '../config/database.js';
import {
  surveyAnswerRepository,
  surveyQuestionRepository,
  surveyQuestionOptionRepository,
} from '../repositories/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { QUESTION_TYPES, MESSAGES } from '../constants/index.js';

export const surveyAnswerService = {
  listByResponse(responseId) {
    return surveyAnswerRepository.findByResponse(responseId);
  },

  listByQuestion(questionId) {
    return surveyAnswerRepository.findByQuestion(questionId);
  },

  async statsByQuestion(questionId) {
    const question = await surveyQuestionRepository.findById(questionId);
    if (!question) throw new NotFoundError(MESSAGES.NOT_FOUND.QUESTION);

    if (question.questionType === QUESTION_TYPES.TEXT) {
      const answers = await surveyAnswerRepository.findByQuestion(questionId);
      return {
        questionId,
        questionContent: question.questionContent,
        questionType: QUESTION_TYPES.TEXT,
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

  /** Thống kê toàn bộ khảo sát — gộp statsByQuestion() cho mọi câu hỏi và tính tổng quan đối tượng/phản hồi. */
  async statsBySurvey(surveyId) {
    const questions = await surveyQuestionRepository.findBySurvey(surveyId);

    const [totalAssigned, totalResponses] = await Promise.all([
      prisma.surveyTarget.count({ where: { surveyId } }),
      prisma.surveyResponse.count({ where: { surveyId } }),
    ]);

    const completionRate = totalAssigned > 0
      ? Math.round((totalResponses / totalAssigned) * 100)
      : 0;

    const questionStats = await Promise.all(
      questions.map(async (q) => {
        const stat = await this.statsByQuestion(q.questionId);
        if (q.questionType === QUESTION_TYPES.TEXT) {
          return {
            questionId: q.questionId,
            questionContent: q.questionContent,
            questionType: q.questionType,
            totalResponses: stat.totalAnswers,
            breakdown: [],
            textAnswers: stat.answers || [],
          };
        }

        const breakdown = (stat.options || []).map((opt) => ({
          optionId: opt.optionId,
          optionText: opt.optionText,
          count: opt.count,
          percentage: stat.totalAnswers > 0 ? Math.round((opt.count / stat.totalAnswers) * 100) : 0,
        }));

        return {
          questionId: q.questionId,
          questionContent: q.questionContent,
          questionType: q.questionType,
          totalResponses: stat.totalAnswers,
          breakdown,
        };
      })
    );

    return {
      surveyId,
      totalAssigned,
      totalResponses,
      completionRate,
      questions: questionStats,
    };
  },
};

export default surveyAnswerService;
