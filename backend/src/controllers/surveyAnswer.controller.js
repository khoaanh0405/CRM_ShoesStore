/**
 * Controller cho SurveyAnswer — chủ yếu phục vụ "Thống kê kết quả khảo sát"
 * (mục 4.1.7). Không có endpoint tạo answer riêng lẻ vì answer chỉ được tạo
 * theo cả bài qua surveyResponseController.submit().
 */
import { surveyAnswerService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const surveyAnswerController = {
  async listByResponse(req, res) {
    const responseId = parseId(req.params.responseId, 'responseId');
    res.json(await surveyAnswerService.listByResponse(responseId));
  },

  /** Thống kê 1 câu hỏi: SINGLE_CHOICE đếm theo option, TEXT trả nguyên văn. */
  async statsByQuestion(req, res) {
    const questionId = parseId(req.params.questionId, 'questionId');
    res.json(await surveyAnswerService.statsByQuestion(questionId));
  },

  /** Thống kê toàn bộ khảo sát — gộp thống kê của mọi câu hỏi. */
  async statsBySurvey(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    res.json(await surveyAnswerService.statsBySurvey(surveyId));
  },
};

export default surveyAnswerController;
