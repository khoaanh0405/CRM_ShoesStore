import { prisma } from '../config/index.js';
import { countOnlineCustomers } from '../middleware/index.js';

export const adminController = {
  async getDashboardStats(req, res) {
    try {
      // Đếm tổng số khách hàng không bị xóa mềm
      const totalCustomers = await prisma.customer.count({
        where: { isDeleted: false }
      });

      // Đếm tổng số sản phẩm
      const totalProducts = await prisma.product.count({
        where: { isActive: true }
      });

      // Đếm tổng số đánh giá đang chờ duyệt (Pending)
      const pendingFeedbacks = await prisma.feedback.count({
        where: { status: 'Pending' }
      });

      // Đếm tổng số khảo sát đang hoạt động
      const activeSurveys = await prisma.survey.count({
        where: { isActive: true }
      });

      res.json({
        data: {
          totalCustomers,
          totalProducts,
          pendingFeedbacks,
          activeSurveys
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy thống kê dashboard', error: error.message });
    }
  },

  async getOnlineCount(req, res) {
    res.json({ count: countOnlineCustomers() });
  },
};
