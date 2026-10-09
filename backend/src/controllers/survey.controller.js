import { surveyService } from '../services/index.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId, parseBoolean } from '../utils/index.js';

export const surveyController = {
  async list(req, res) {
    res.json(await surveyService.list({ isActive: parseBoolean(req.query.isActive) }));
  },

  async getById(req, res) {
    res.json(await surveyService.getById(parseId(req.params.id, 'surveyId')));
  },

  async getWithQuestions(req, res) {
    res.json(await surveyService.getWithQuestions(parseId(req.params.id, 'surveyId')));
  },

  /** createdBy lấy từ token Manager đang đăng nhập. */
  async createSimple(req, res) {
    const { title, description, isActive, productId } = req.body;
    const survey = await surveyService.createSimple({
      title, description, isActive, productId, createdBy: req.user.accountId,
    });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CREATE_SURVEY, entityType: AUDIT_ENTITY.SURVEY, entityId: survey.surveyId,
      description: `Tạo khảo sát "${survey.title}"`,
    });
    res.status(201).json(survey);
  },

  async create(req, res) {
    const { title, description, questions, productId } = req.body;
    const survey = await surveyService.createWithQuestions({
      title, description, questions, productId, createdBy: req.user.accountId,
    });
    await auditLogService.record(req, {
      action: AUDIT_ACTION.CREATE_SURVEY, entityType: AUDIT_ENTITY.SURVEY, entityId: survey.surveyId,
      description: `Tạo khảo sát "${survey.title}" (${questions.length} câu hỏi)`,
    });
    res.status(201).json(survey);
  },

  async update(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    const { title, description } = req.body;
    res.json(await surveyService.update(surveyId, { title, description }));
  },

  async setActive(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    const isActive = parseBoolean(req.body.isActive);
    const survey = await surveyService.setActive(surveyId, isActive);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.TOGGLE_SURVEY, entityType: AUDIT_ENTITY.SURVEY, entityId: surveyId,
      description: `${isActive ? 'Kích hoạt' : 'Đóng'} khảo sát #${surveyId}${survey?.title ? ` "${survey.title}"` : ''}`,
    });
    res.json(survey);
  },

  async assignToCustomers(req, res) {
    const surveyId = parseId(req.params.id, 'surveyId');
    const result = await surveyService.assignToCustomers(surveyId, req.body.customerIds);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.ASSIGN_SURVEY, entityType: AUDIT_ENTITY.SURVEY, entityId: surveyId,
      description: `Gửi khảo sát #${surveyId}: ${result.sent} khách mới, ${result.updated} cập nhật, ${result.skipped} bỏ qua`,
    });
    res.status(201).json(result);
  },
};

export default surveyController;