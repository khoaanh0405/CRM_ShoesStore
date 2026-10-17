import { prisma } from '../config/index.js';
import { countOnlineCustomers } from '../middleware/index.js';

export const adminController = {
  async getDashboardStats(req, res) {
    try {
      const [totalCustomers, totalProducts, pendingFeedbacks, activeSurveys] = await Promise.all([
        prisma.customer.count({ where: { isDeleted: false } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.feedback.count({ where: { status: 'Pending', isDeleted: false } }),
        prisma.survey.count({ where: { isActive: true } }),
      ]);
      res.json({ data: { totalCustomers, totalProducts, pendingFeedbacks, activeSurveys } });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy thống kê dashboard', error: error.message });
    }
  },
  async getOnlineCount(req, res) {
    res.json({ count: countOnlineCustomers() });
  },
};
