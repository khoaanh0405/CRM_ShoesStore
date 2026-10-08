import { feedbackService } from '../services/index.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId, parseNumber } from '../utils/index.js';
import { ForbiddenError, ConflictError } from '../errors/AppError.js';
import { ROLE_NAMES, FEEDBACK_STATUS } from '../constants/index.js';

const isCustomer = (req) => req.user?.roleName === ROLE_NAMES.CUSTOMER;

export const feedbackController = {
  async list(req, res) {
    res.json(await feedbackService.list({
      status: req.query.status,
      productId: parseNumber(req.query.productId),
      customerId: parseNumber(req.query.customerId),
    }));
  },

  /** Khách chỉ xem được đánh giá của chính mình. */
  async getById(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    const fb = await feedbackService.getById(feedbackId);
    if (isCustomer(req) && fb.customerId !== req.user.customerId) {
      throw new ForbiddenError('Bạn không có quyền xem đánh giá này.');
    }
    res.json(fb);
  },

  async listByCustomer(req, res) {
    res.json(await feedbackService.listByCustomer(parseId(req.params.customerId, 'customerId')));
  },

  async listByProduct(req, res) {
    res.json(await feedbackService.listByProduct(parseId(req.params.productId, 'productId')));
  },

  async create(req, res) {
    const { customerId, productId, title, content, rating, imageUrl } = req.body;
    const feedback = await feedbackService.create({ customerId, productId, title, content, rating, imageUrl });
    res.status(201).json(feedback);
  },

  /**
   * Khách chỉnh sửa đánh giá: chỉ của chính mình VÀ chỉ khi còn "Pending"
   * (Manager chưa duyệt/từ chối).
   */
  async update(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    if (!isCustomer(req)) {
      throw new ForbiddenError('Chỉ khách hàng mới được chỉnh sửa đánh giá của mình.');
    }
    const fb = await feedbackService.getById(feedbackId);
    if (fb.customerId !== req.user.customerId) {
      throw new ForbiddenError('Bạn chỉ được chỉnh sửa đánh giá của chính mình.');
    }
    if (fb.status !== FEEDBACK_STATUS.PENDING) {
      throw new ConflictError('Đánh giá đã được xử lý nên không thể chỉnh sửa.');
    }
    const { title, content, rating, imageUrl } = req.body;
    res.json(await feedbackService.update(feedbackId, { title, content, rating, imageUrl }));
  },

  async updateStatus(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    const { status } = req.body;
    const fb = await feedbackService.updateStatus(feedbackId, status);
    const approved = status === FEEDBACK_STATUS.APPROVED;
    await auditLogService.record(req, {
      action: approved ? AUDIT_ACTION.APPROVE_FEEDBACK : AUDIT_ACTION.REJECT_FEEDBACK,
      entityType: AUDIT_ENTITY.FEEDBACK, entityId: feedbackId,
      description: `${approved ? 'Duyệt' : 'Từ chối'} đánh giá #${feedbackId}${fb?.title ? ` "${fb.title}"` : ''}`,
    });
    res.json(fb);
  },

  async remove(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');

    if (isCustomer(req)) {
      const fb = await feedbackService.getById(feedbackId);
      if (fb.customerId !== req.user.customerId) {
        throw new ForbiddenError('Bạn chỉ được thu hồi đánh giá của chính mình.');
      }
      if (fb.status !== FEEDBACK_STATUS.PENDING) {
        throw new ConflictError('Chỉ thu hồi được đánh giá đang chờ duyệt.');
      }
    }

    await feedbackService.remove(feedbackId);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.DELETE_FEEDBACK, entityType: AUDIT_ENTITY.FEEDBACK, entityId: feedbackId,
      description: `Xóa đánh giá #${feedbackId}`,
    });
    res.status(204).send();
  },
};

export default feedbackController;