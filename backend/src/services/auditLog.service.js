import { auditLogRepository } from '../repositories/auditLog.repository.js';
import { ROLE_NAMES } from '../constants/index.js';

export const auditLogService = {
  /**
   * Ghi nhật ký thao tác của Admin/Manager. KHÔNG bao giờ ném lỗi ra ngoài —
   * ghi log thất bại không được làm hỏng thao tác chính.
   * req.user lấy từ middleware authenticate.
   */
  async record(req, { action, entityType, entityId = null, description }) {
    try {
      const u = req.user;
      if (!u || (u.roleName !== ROLE_NAMES.ADMIN && u.roleName !== ROLE_NAMES.MANAGER)) return;
      await auditLogRepository.create({
        actorId: u.accountId, actorName: u.username ?? `#${u.accountId}`, actorRole: u.roleName,
        action, entityType, entityId, description,
      });
    } catch (err) {
      console.error('[AUDIT] Không ghi được nhật ký:', err.message);
    }
  },

  list(params) {
    return auditLogRepository.search(params);
  },
};

export default auditLogService;