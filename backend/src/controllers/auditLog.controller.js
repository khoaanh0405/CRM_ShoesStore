import { auditLogService } from '../services/auditLog.service.js';
import { parseNumber } from '../utils/index.js';

export const auditLogController = {
  /** GET /api/audit-logs?page=&limit=&keyword=&actorRole=&action=&entityType=&from=YYYY-MM-DD&to=YYYY-MM-DD */
  async list(req, res) {
    const page = Math.max(1, parseNumber(req.query.page) ?? 1);
    const limit = Math.min(100, Math.max(1, parseNumber(req.query.limit) ?? 20));
    const { keyword, actorRole, action, entityType, from, to } = req.query;
    const { items, total } = await auditLogService.list({
      page, limit,
      keyword: keyword?.trim() || undefined,
      actorRole: actorRole || undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      from: /^\d{4}-\d{2}-\d{2}$/.test(from ?? '') ? from : undefined,
      to: /^\d{4}-\d{2}-\d{2}$/.test(to ?? '') ? to : undefined,
    });
    res.json({ items, total, page, pageSize: limit });
  },
};

export default auditLogController;