import { Router } from 'express';
import { auditLogController } from '../controllers/auditLog.controller.js';
import { adminOnly } from '../middleware/index.js';

const router = Router();
router.get('/', adminOnly, auditLogController.list);
export default router;
