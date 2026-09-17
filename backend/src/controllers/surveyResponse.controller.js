/**
 * Controller cho SurveyResponse — chứa endpoint quan trọng nhất của đồ án:
 * POST /api/surveys/:surveyId/submit (khách hàng nộp khảo sát). Service chạy
 * toàn bộ trong 1 transaction: tạo response -> tạo answers -> đánh dấu
 * SurveyTarget.isCompleted.
 */
import { surveyResponseService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const surveyResponseController = {
  async getById(req, res) {
    const responseId = parseId(req.params.id, 'responseId');
    res.json(await surveyResponseService.getById(responseId));
  },

  /** Chi tiết 1 bài làm kèm toàn bộ câu trả lời + câu hỏi + lựa chọn. */
  async getWithAnswers(req, res) {
    const responseId = parseId(req.params.id, 'responseId');
    res.json(await surveyResponseService.getWithAnswers(responseId));
  },

  async listBySurvey(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    res.json(await surveyResponseService.listBySurvey(surveyId));
  },

  async listByCustomer(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    res.json(await surveyResponseService.listByCustomer(customerId));
  },

  /**
   * Body: { customerId, answers: [{ questionId, answerValue, optionId? }] }
   * Phải trả lời đủ toàn bộ câu hỏi của khảo sát, nếu không Service trả 400.
   */
  async submit(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    const { customerId, answers } = req.body;
    const response = await surveyResponseService.submit({ surveyId, customerId, answers });
    res.status(201).json(response);
  },

  async remove(req, res) {
    const responseId = parseId(req.params.id, 'responseId');
    await surveyResponseService.remove(responseId);
    res.status(204).send();
  },
};

export default surveyResponseController;
