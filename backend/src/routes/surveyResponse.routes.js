/**
 * /api/responses — xem/xóa 1 bài khảo sát đã nộp.
 * Việc NỘP bài nằm ở survey.routes.js (/api/surveys/:surveyId/submit) vì
 * cần biết nộp cho khảo sát nào.
 *
 * DELETE an toàn: survey_answers.response_id là CASCADE nên xóa response sẽ
 * tự xóa toàn bộ câu trả lời con.
 */
import { Router } from 'express';
import { surveyResponseController, surveyAnswerController } from '../controllers/index.js';
import { surveyResponseValidator } from '../validators/index.js';
import { authenticate, managerOnly } from '../middleware/index.js';

const router = Router();

router.get('/:id', authenticate, surveyResponseValidator.idParam, surveyResponseController.getById);
/** Bài làm kèm đầy đủ câu trả lời + câu hỏi + lựa chọn đã chọn. */
router.get(
  '/:id/answers',
  authenticate,
  surveyResponseValidator.idParam,
  surveyResponseController.getWithAnswers
);
/** Danh sách câu trả lời "thô" (không kèm quan hệ) — phục vụ thống kê. */
router.get(
  '/:responseId/answers-raw',
  managerOnly,
  surveyResponseValidator.responseIdParam,
  surveyAnswerController.listByResponse
);
router.delete('/:id', managerOnly, surveyResponseValidator.idParam, surveyResponseController.remove);

export default router;
