/**
 * /api/presence — báo "đang online" / "đã rời web".
 * Dùng optionalAuthenticate (không bắt buộc đăng nhập) vì khách đang ở
 * trang đăng nhập/đăng ký cũng cần được tính là đang online.
 */
import { Router } from 'express';
import { optionalAuthenticate, heartbeat, markOffline } from '../middleware/index.js';

const router = Router();

router.post('/heartbeat', optionalAuthenticate, heartbeat);
router.post('/offline', optionalAuthenticate, markOffline);

export default router;
