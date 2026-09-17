/**
 * /api/roles — quản lý vai trò. Toàn bộ là nghiệp vụ quản trị nên gắn
 * adminOnly (authenticate + authorize('Admin')).
 *
 * Thứ tự middleware trên mỗi route đúng theo sơ đồ phân lớp:
 *   Middleware (auth) -> Validators -> Controller
 */
import { Router } from 'express';
import { roleController } from '../controllers/index.js';
import { roleValidator } from '../validators/index.js';
import { adminOnly } from '../middleware/index.js';

const router = Router();

router.get('/', adminOnly, roleController.list);
router.get('/:id', adminOnly, roleValidator.idParam, roleController.getById);
router.post('/', adminOnly, roleValidator.create, roleController.create);
router.put('/:id', adminOnly, roleValidator.idParam, roleValidator.update, roleController.update);
router.delete('/:id', adminOnly, roleValidator.idParam, roleController.remove);

export default router;
