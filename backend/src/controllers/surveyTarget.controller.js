import { surveyTargetService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const surveyTargetController = {
  async listBySurvey(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    res.json(await surveyTargetService.listBySurvey(surveyId));
  },

  /** Danh sách khảo sát 1 khách hàng nhận được — trang "khảo sát của tôi". */
  async listByCustomer(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    res.json(await surveyTargetService.listByCustomer(customerId));
  },

  /** Gán 1 khách hàng — body { customerId }. */
  async assign(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    const customerId = parseId(req.body.customerId, 'customerId');
    const target = await surveyTargetService.assign(surveyId, customerId);
    res.status(201).json(target);
  },

  /** Gán hàng loạt — body { customerIds: [1,2,3] }. */
  async assignMany(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    const result = await surveyTargetService.assignMany(surveyId, req.body.customerIds);
    res.status(201).json(result);
  },

  async remove(req, res) {
    const surveyId = parseId(req.params.surveyId, 'surveyId');
    const customerId = parseId(req.params.customerId, 'customerId');
    await surveyTargetService.remove(surveyId, customerId);
    res.status(204).send();
  },
};

export default surveyTargetController;
