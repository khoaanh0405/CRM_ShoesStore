/**
 * /api/surveys — khảo sát và toàn bộ resource con (câu hỏi, danh sách gửi,
 * bài nộp, thống kê). Đây là file route lớn nhất vì Survey là gốc của cả
 * nhánh nghiệp vụ khảo sát.
 *
 * KHÔNG có endpoint DELETE /:id — đúng thiết kế: survey_responses tham chiếu
 * surveys với FK RESTRICT nên xóa cứng luôn thất bại khi đã có người trả
 * lời. Thay bằng PATCH /:id/active với isActive=false để "đóng" khảo sát.
 */
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
import { authenticate, adminOnly } from '../middleware/index.js';

const router = Router();

// --- Khảo sát ---
router.get('/', authenticate, surveyController.list);
router.post('/', adminOnly, surveyValidator.create, surveyController.create);
router.get('/:id', authenticate, surveyValidator.idParam, surveyController.getById);
/** /full = khảo sát kèm câu hỏi + lựa chọn, dùng khi khách hàng vào làm bài. */
router.get('/:id/full', authenticate, surveyValidator.idParam, surveyController.getWithQuestions);
router.put('/:id', adminOnly, surveyValidator.idParam, surveyValidator.update, surveyController.update);
router.patch(
  '/:id/active',
  adminOnly,
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
  adminOnly,
  surveyValidator.idParam,
  surveyValidator.assign,
  surveyController.assignToCustomers
);
router.get(
  '/:surveyId/targets',
  adminOnly,
  surveyTargetValidator.surveyIdParam,
  surveyTargetController.listBySurvey
);
router.post(
  '/:surveyId/targets',
  adminOnly,
  surveyTargetValidator.surveyIdParam,
  surveyTargetValidator.assign,
  surveyTargetController.assign
);
router.post(
  '/:surveyId/targets/bulk',
  adminOnly,
  surveyTargetValidator.surveyIdParam,
  surveyTargetValidator.assignMany,
  surveyTargetController.assignMany
);
router.delete(
  '/:surveyId/targets/:customerId',
  adminOnly,
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
  adminOnly,
  surveyResponseValidator.surveyIdParam,
  surveyResponseController.listBySurvey
);

// --- Thống kê kết quả khảo sát (mục 4.1.7) ---
router.get(
  '/:surveyId/stats',
  adminOnly,
  surveyResponseValidator.surveyIdParam,
  surveyAnswerController.statsBySurvey
);

export default router;
