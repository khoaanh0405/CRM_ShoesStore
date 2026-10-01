import { notificationService } from '../services/index.js';
import { parseId } from '../utils/index.js';
export const notificationController = {
  /** GET /api/customers/:customerId/notifications */
  async listByCustomer(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    res.json(await notificationService.listByCustomer(customerId));
  },
  /** GET /api/customers/:customerId/notifications/unread-count — dùng cho badge số trên chuông. */
  async countUnread(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    const count = await notificationService.countUnread(customerId);
    res.json({ count });
  },
  /** PATCH /api/notifications/:id/read */
  async markRead(req, res) {
    const notificationId = parseId(req.params.id, 'notificationId');
    res.json(await notificationService.markRead(notificationId, req.user?.customerId));
  },
  /** PATCH /api/customers/:customerId/notifications/read-all */
  async markAllRead(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    await notificationService.markAllRead(customerId);
    res.status(204).send();
  },
};
export default notificationController;
