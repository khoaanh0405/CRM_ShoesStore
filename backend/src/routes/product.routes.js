/**
 * /api/products — sản phẩm. Xem/tìm kiếm công khai, thao tác ghi chỉ Admin.
 * Route lồng /:productId/feedbacks gọi sang feedbackController (một resource
 * con của Product) — khai ở đây để URL đọc tự nhiên theo quan hệ dữ liệu.
 */
import { Router } from 'express';
import { productController, feedbackController } from '../controllers/index.js';
import { productValidator, feedbackValidator } from '../validators/index.js';
import { adminOnly } from '../middleware/index.js';

const router = Router();

// /search khai trước /:id để không bị hiểu nhầm "search" là tham số :id.
router.get('/search', productController.search);
router.get('/', productController.list);
router.get('/:id', productValidator.idParam, productController.getById);

// Phản hồi của 1 sản phẩm (đọc từ phía Product).
router.get('/:productId/feedbacks', feedbackValidator.productIdParam, feedbackController.listByProduct);

router.post('/', adminOnly, productValidator.create, productController.create);
router.put('/:id', adminOnly, productValidator.idParam, productValidator.update, productController.update);
router.patch(
  '/:id/active',
  adminOnly,
  productValidator.idParam,
  productValidator.setActive,
  productController.setActive
);
router.delete('/:id', adminOnly, productValidator.idParam, productController.remove);

export default router;
