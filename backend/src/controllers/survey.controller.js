/**
 * Controller cho Survey. Không có endpoint DELETE — theo thiết kế, Survey
 * chỉ được "đóng" bằng PATCH /api/surveys/:id/active với isActive=false
 * (xóa cứng luôn bị FK RESTRICT từ survey_responses chặn).
 */
import { surveyService } from '../services/index.js';
import { parseId, parseBoolean } from '../utils/index.js';

export const surveyController = {
  async list(req, res) {
    res.json(await surveyService.list({ isActive: parseBoolean(req.query.isActive) }));
  },

  async getById(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    res.json(await surveyService.getById(surveyId));
  },

  /** Lấy khảo sát kèm toàn bộ câu hỏi + lựa chọn để khách hàng làm bài. */
  async getWithQuestions(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    res.json(await surveyService.getWithQuestions(surveyId));
  },

  /**
   * Tạo khảo sát kèm câu hỏi trong 1 lần (nested-write).
   * Body: { title, description, questions: [{ questionContent, questionType, options? }] }
   * Yêu cầu tối thiểu 15 câu hỏi (Service tự validate).
   */
  async create(req, res) {
    const { title, description, questions } = req.body;
    const survey = await surveyService.createWithQuestions({ title, description, questions });
    res.status(201).json(survey);
  },

  async update(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    const { title, description } = req.body;
    res.json(await surveyService.update(surveyId, { title, description }));
  },

  /** Đóng/mở khảo sát — body { isActive: true|false }. */
  async setActive(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    res.json(await surveyService.setActive(surveyId, parseBoolean(req.body.isActive)));
  },

  /** Gửi khảo sát tới nhiều khách hàng — body { customerIds: [1, 2, 3] }. */
  async assignToCustomers(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    const result = await surveyService.assignToCustomers(surveyId, req.body.customerIds);
    res.status(201).json(result);
  },
};

export default surveyController;
