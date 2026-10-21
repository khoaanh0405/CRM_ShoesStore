import { feedbackService } from '../services/index.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId, parseNumber } from '../utils/index.js';
import { ForbiddenError, ConflictError } from '../errors/AppError.js';
import { ROLE_NAMES, FEEDBACK_STATUS } from '../constants/index.js';

const isCustomer = (req) => req.user?.roleName === ROLE_NAMES.CUSTOMER;

export const feedbackController = {
  async list(req, res) {
    res.json(await feedbackService.list({ status: req.query.status, productId: parseNumber(req.query.productId), customerId: parseNumber(req.query.customerId) }));
  },
  async getById(req, res) {
    const fb = await feedbackService.getById(parseId(req.params.id, 'feedbackId'));
    if (isCustomer(req) && fb.customerId !== req.user.customerId) throw new ForbiddenError('Bạn không có quyền xem đánh giá này.');
    res.json(fb);
  },
  async listByCustomer(req, res) { res.json(await feedbackService.listByCustomer(parseId(req.params.customerId, 'customerId'))); },
  async listByProduct(req, res) { res.json(await feedbackService.listByProduct(parseId(req.params.productId, 'productId'))); },
  /** Nội dung được kiểm duyệt tự động ở Service; vi phạm -> 400 { code, message } kèm lý do. */
  async create(req, res) {
    const { customerId, productId, title, content, rating, imageUrl } = req.body;
    res.status(201).json(await feedbackService.create({ customerId, productId, title, content, rating, imageUrl }));
  },
  /** Khách chỉ sửa đánh giá của chính mình (trừ đánh giá cũ đã bị gỡ). Nội dung sửa vẫn bị kiểm duyệt ở Service. */
  async update(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    if (!isCustomer(req)) throw new ForbiddenError('Chỉ khách hàng mới được chỉnh sửa đánh giá của mình.');
    const fb = await feedbackService.getById(feedbackId);
    if (fb.customerId !== req.user.customerId) throw new ForbiddenError('Bạn chỉ được chỉnh sửa đánh giá của chính mình.');
    if (fb.status === FEEDBACK_STATUS.REJECTED) throw new ConflictError('Đánh giá này đã bị gỡ nên không thể chỉnh sửa.');
    const { title, content, rating, imageUrl } = req.body;
    res.json(await feedbackService.update(feedbackId, { title, content, rating, imageUrl }));
  },
  /** Manager xóa được mọi đánh giá; khách chỉ thu hồi được đánh giá của chính mình. */
  async remove(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    if (isCustomer(req)) {
      const fb = await feedbackService.getById(feedbackId);
      if (fb.customerId !== req.user.customerId) throw new ForbiddenError('Bạn chỉ được thu hồi đánh giá của chính mình.');
    }
    await feedbackService.remove(feedbackId);
    await auditLogService.record(req, { action: AUDIT_ACTION.DELETE_FEEDBACK, entityType: AUDIT_ENTITY.FEEDBACK, entityId: feedbackId, description: `Xóa đánh giá #${feedbackId}` });
    res.status(204).send();
  },
};
export default feedbackController;
