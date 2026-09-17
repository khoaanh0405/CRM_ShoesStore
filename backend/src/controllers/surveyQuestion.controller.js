import { surveyQuestionService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const surveyQuestionController = {
  async listBySurvey(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    res.json(await surveyQuestionService.listBySurvey(surveyId));
  },

  async getById(req, res) {
    const questionId = parseId(req.params.id, 'questionId');
    res.json(await surveyQuestionService.getById(questionId));
  },

  /** Body: { surveyId, questionContent, questionType, options?: ['A','B'] }. */
  async create(req, res) {
    const { surveyId, questionContent, questionType, options } = req.body;
    const question = await surveyQuestionService.create({
      surveyId, questionContent, questionType, options,
    });
    res.status(201).json(question);
  },

  async update(req, res) {
    const questionId = parseId(req.params.id, 'questionId');
    const { questionContent, questionType } = req.body;
    res.json(await surveyQuestionService.update(questionId, { questionContent, questionType }));
  },

  /** Chỉ xóa được khi chưa có ai trả lời (FK RESTRICT -> Service trả 409). */
  async remove(req, res) {
    const questionId = parseId(req.params.id, 'questionId');
    await surveyQuestionService.remove(questionId);
    res.status(204).send();
  },
};

export default surveyQuestionController;
