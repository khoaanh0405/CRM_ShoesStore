import { Router } from 'express';
import { bannerController } from '../controllers/banner.controller.js';
import { adminOnly } from '../middleware/index.js';
import { validateBody, validateParams } from '../validators/common.validator.js';

const router = Router();

const FIELDS = {
  title: { type: 'string', maxLength: 150 },
  sortOrder: { type: 'int', min: 0 },
  isActive: { type: 'boolean' },
};

// Công khai: banner đang bật cho web khách hàng
router.get('/', bannerController.listActive);

// Admin
router.get('/all', adminOnly, bannerController.listAll);
router.post('/', adminOnly, validateBody({ ...FIELDS, imageUrl: { required: true, type: 'string' } }), bannerController.create);
router.put('/:id', adminOnly, validateParams('id'), validateBody({ ...FIELDS, imageUrl: { type: 'string' } }), bannerController.update);
router.patch('/:id/active', adminOnly, validateParams('id'), validateBody({ isActive: { required: true, type: 'boolean' } }), bannerController.setActive);
router.delete('/:id', adminOnly, validateParams('id'), bannerController.remove);

export default router;