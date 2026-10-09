import { reviewReplyService } from '../services/reviewReply.service.js';
import { auditLogService } from '../services/auditLog.service.js';
import { AUDIT_ACTION, AUDIT_ENTITY } from '../constants/audit.constant.js';
import { parseId } from '../utils/index.js';

const preview = (s) => (s.length > 60 ? `${s.slice(0, 60)}…` : s);

export const reviewReplyController = {
  async listByFeedback(req, res) {
    res.json(await reviewReplyService.listByFeedback(parseId(req.params.id, 'feedbackId')));
  },

  async create(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    const reply = await reviewReplyService.create(feedbackId, req.user.accountId, req.body.content);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.REPLY_FEEDBACK, entityType: AUDIT_ENTITY.REPLY, entityId: reply.replyId,
      description: `Trả lời đánh giá #${feedbackId}: "${preview(reply.content)}"`,
    });
    res.status(201).json(reply);
  },

  async update(req, res) {
    const replyId = parseId(req.params.id, 'replyId');
    const reply = await reviewReplyService.update(replyId, req.user.accountId, req.body.content);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.UPDATE_REPLY, entityType: AUDIT_ENTITY.REPLY, entityId: replyId,
      description: `Sửa phản hồi #${replyId} của đánh giá #${reply.feedbackId}`,
    });
    res.json(reply);
  },

  async remove(req, res) {
    const replyId = parseId(req.params.id, 'replyId');
    const reply = await reviewReplyService.remove(replyId, req.user.accountId);
    await auditLogService.record(req, {
      action: AUDIT_ACTION.DELETE_REPLY, entityType: AUDIT_ENTITY.REPLY, entityId: replyId,
      description: `Xóa phản hồi #${replyId} của đánh giá #${reply.feedbackId}`,
    });
    res.status(204).send();
  },
};

export default reviewReplyController;