import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { adminOnly } from '../middleware/index.js';
import { validateBody, validateParams } from '../validators/common.validator.js';

const router = Router();

const FIELDS = {
  categoryName: { required: true, type: 'string', maxLength: 100 },
  description: { type: 'string', maxLength: 255 },
};

router.get('/', categoryController.list); // công khai (customer cũng dùng được)
router.post('/', adminOnly, validateBody(FIELDS), categoryController.create);
router.put('/:id', adminOnly, validateParams('id'), validateBody(FIELDS), categoryController.update);
router.delete('/:id', adminOnly, validateParams('id'), categoryController.remove);

export default router;