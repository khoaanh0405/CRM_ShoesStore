/** /api/replies — sửa/xóa phản hồi của chính Manager. Tạo/liệt kê nằm ở feedback.routes.js */
import { Router } from 'express';
import { reviewReplyController } from '../controllers/reviewReply.controller.js';
import { managerOnly } from '../middleware/index.js';
import { validateBody, validateParams } from '../validators/common.validator.js';

const router = Router();
const BODY = { content: { required: true, type: 'string', maxLength: 2000 } };

router.put('/:id', managerOnly, validateParams('id'), validateBody(BODY), reviewReplyController.update);
router.delete('/:id', managerOnly, validateParams('id'), reviewReplyController.remove);

export default router;