/**
 * /api/surveys — khảo sát và toàn bộ resource con (câu hỏi, danh sách gửi,
 * bài nộp, thống kê). Đây là file route lớn nhất vì Survey là gốc của cả
 * nhánh nghiệp vụ khảo sát.
 *
 * KHÔNG có endpoint DELETE /:id — đúng thiết kế: survey_responses tham chiếu
 * surveys với FK RESTRICT nên xóa cứng luôn thất bại khi đã có người trả
 * lời. Thay bằng PATCH /:id/active với isActive=false để "đóng" khảo sát.
 */
import { authenticate, managerOnly, rateLimit, ownCustomerOnly } from '../middleware/index.js';
import { Router } from 'express';
import {
  surveyController,
  surveyQuestionController,
  surveyTargetController,
  surveyResponseController,
  surveyAnswerController,
} from '../controllers/index.js';
import {
  surveyValidator,
  surveyQuestionValidator,
  surveyTargetValidator,
  surveyResponseValidator,
} from '../validators/index.js';
import { validateBody } from '../validators/common.validator.js';

const router = Router();

// --- Khảo sát ---
router.get('/', authenticate, managerOnly, surveyController.list);
/**
 * POST /api/surveys/simple — Tạo khảo sát đơn giản (chỉ cần title + description
 * + isActive), không cần câu hỏi ngay. Dùng cho form tạo nhanh trên Admin UI.
 * Câu hỏi/tùy chọn được thêm riêng sau qua /api/questions & /api/options.
 */
router.post(
  '/simple',
  managerOnly,
  validateBody({
    title: { required: true, type: 'string', maxLength: 200 },
    description: { type: 'string' },
    isActive: { type: 'boolean' },
  }),
  surveyController.createSimple
);
/** POST /api/surveys — Tạo kèm câu hỏi ngay (batch, yêu cầu >=15 câu hỏi). */
router.post('/', managerOnly, surveyValidator.create, surveyController.create);
router.get('/:id', authenticate, surveyValidator.idParam, surveyController.getById);
/** /full = khảo sát kèm câu hỏi + lựa chọn, dùng khi khách hàng vào làm bài. */
router.get('/:id/full', authenticate, surveyValidator.idParam, surveyController.getWithQuestions);
router.put('/:id', managerOnly, surveyValidator.idParam, surveyValidator.update, surveyController.update);
router.patch(
  '/:id/active',
  managerOnly,
  surveyValidator.idParam,
  surveyValidator.setActive,
  surveyController.setActive
);

// --- Câu hỏi của khảo sát ---
router.get(
  '/:surveyId/questions',
  authenticate,
  surveyQuestionValidator.surveyIdParam,
  surveyQuestionController.listBySurvey
);

// --- Gửi khảo sát tới khách hàng (mục 4.1.6) ---
/** Gán hàng loạt qua surveyService (có lọc khách hàng đã bị soft-delete). */
router.post(
  '/:id/assign',
  managerOnly,
  surveyValidator.idParam,
  surveyValidator.assign,
  surveyController.assignToCustomers
);
router.get(
  '/:surveyId/targets',
  managerOnly,
  surveyTargetValidator.surveyIdParam,
  surveyTargetController.listBySurvey
);
router.post(
  '/:surveyId/targets',
  managerOnly,
  surveyTargetValidator.surveyIdParam,
  surveyTargetValidator.assign,
  surveyTargetController.assign
);
router.post(
  '/:surveyId/targets/bulk',
  managerOnly,
  surveyTargetValidator.surveyIdParam,
  surveyTargetValidator.assignMany,
  surveyTargetController.assignMany
);
router.delete(
  '/:surveyId/targets/:customerId',
  managerOnly,
  surveyTargetValidator.compositeParams,
  surveyTargetController.remove
);

// --- Khách hàng nộp bài (mục 4.3.4) ---
router.post(
  '/:surveyId/submit',
  authenticate,
  surveyResponseValidator.surveyIdParam,
  surveyResponseValidator.submit,
  surveyResponseController.submit
);
router.get(
  '/:surveyId/responses',
  managerOnly,
  surveyResponseValidator.surveyIdParam,
  surveyResponseController.listBySurvey
);

// --- Thống kê kết quả khảo sát (mục 4.1.7) ---
router.get(
  '/:surveyId/stats',
  managerOnly,
  surveyResponseValidator.surveyIdParam,
  surveyAnswerController.statsBySurvey
);

router.post(
  '/:surveyId/submit',
  authenticate,
  rateLimit({ windowMs: 60 * 1000, max: 5, message: 'Bạn nộp khảo sát quá nhiều lần.' }),
  surveyResponseValidator.surveyIdParam,
  surveyResponseValidator.submit,
  ownCustomerOnly,
  surveyResponseController.submit
);

export default router;
