/**
 * /api/suppliers — nhà cung cấp.
 * GET / và GET /search để công khai (khách hàng có thể xem), các thao tác
 * ghi dữ liệu chỉ Admin.
 */
import { Router } from 'express';
import { supplierController } from '../controllers/index.js';
import { supplierValidator } from '../validators/index.js';
import { adminOnly } from '../middleware/index.js';

const router = Router();

// /search phải đứng TRƯỚC /:id, nếu không Express sẽ coi "search" là :id.
router.get('/search', supplierController.search);
router.get('/', supplierController.list);
router.get('/:id', supplierValidator.idParam, supplierController.getById);
router.get('/:id/products', supplierValidator.idParam, supplierController.getWithProducts);

router.post('/', adminOnly, supplierValidator.create, supplierController.create);
router.put('/:id', adminOnly, supplierValidator.idParam, supplierValidator.update, supplierController.update);
router.delete('/:id', adminOnly, supplierValidator.idParam, supplierController.remove);

export default router;
