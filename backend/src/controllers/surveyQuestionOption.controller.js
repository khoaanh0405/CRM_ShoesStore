import { surveyQuestionOptionService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const surveyQuestionOptionController = {
  async listByQuestion(req, res) {
    const questionId = parseId(req.params.questionId, 'questionId');
    res.json(await surveyQuestionOptionService.listByQuestion(questionId));
  },

  /** Body: { questionId, optionText, sortOrder? } — chỉ cho câu SINGLE_CHOICE. */
  async create(req, res) {
    const { questionId, optionText, sortOrder } = req.body;
    const option = await surveyQuestionOptionService.create({ questionId, optionText, sortOrder });
    res.status(201).json(option);
  },

  async update(req, res) {
    const optionId = parseId(req.params.id, 'optionId');
    const { optionText, sortOrder } = req.body;
    res.json(await surveyQuestionOptionService.update(optionId, { optionText, sortOrder }));
  },

  async remove(req, res) {
    const optionId = parseId(req.params.id, 'optionId');
    await surveyQuestionOptionService.remove(optionId);
    res.status(204).send();
  },
};

export default surveyQuestionOptionController;
