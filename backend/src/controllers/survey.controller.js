/**
 * Controller cho Survey. Không có DELETE — chỉ "đóng" bằng PATCH /:id/active.
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

  async getWithQuestions(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    res.json(await surveyService.getWithQuestions(surveyId));
  },

  /** Body: { title, description?, isActive?, productId? } — productId null/không gửi = khảo sát chung. */
  async createSimple(req, res) {
    const { title, description, isActive, productId } = req.body;
    const survey = await surveyService.createSimple({ title, description, isActive, productId });
    res.status(201).json(survey);
  },

  /** Body: { title, description, questions, productId? } */
  async create(req, res) {
    const { title, description, questions, productId } = req.body;
    const survey = await surveyService.createWithQuestions({ title, description, questions, productId });
    res.status(201).json(survey);
  },

  async update(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    const { title, description } = req.body;
    res.json(await surveyService.update(surveyId, { title, description }));
  },

  async setActive(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    res.json(await surveyService.setActive(surveyId, parseBoolean(req.body.isActive)));
  },

  async assignToCustomers(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    const result = await surveyService.assignToCustomers(surveyId, req.body.customerIds);
    res.status(201).json(result);
  },
};

export default surveyController;
