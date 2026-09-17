/**
 * /api/questions — thao tác trên 1 câu hỏi cụ thể theo question_id.
 * Việc liệt kê câu hỏi THEO khảo sát nằm ở survey.routes.js
 * (/api/surveys/:surveyId/questions).
 */
import { Router } from 'express';
import {
  surveyQuestionController,
  surveyQuestionOptionController,
  surveyAnswerController,
} from '../controllers/index.js';
import {
  surveyQuestionValidator,
  surveyQuestionOptionValidator,
} from '../validators/index.js';
import { authenticate, adminOnly } from '../middleware/index.js';

const router = Router();

router.post('/', adminOnly, surveyQuestionValidator.create, surveyQuestionController.create);
router.get('/:id', authenticate, surveyQuestionValidator.idParam, surveyQuestionController.getById);
router.put(
  '/:id',
  adminOnly,
  surveyQuestionValidator.idParam,
  surveyQuestionValidator.update,
  surveyQuestionController.update
);
/** Chỉ xóa được khi chưa có ai trả lời — FK RESTRICT, Service đổi thành 409. */
router.delete('/:id', adminOnly, surveyQuestionValidator.idParam, surveyQuestionController.remove);

// --- Lựa chọn của câu hỏi ---
router.get(
  '/:questionId/options',
  authenticate,
  surveyQuestionOptionValidator.questionIdParam,
  surveyQuestionOptionController.listByQuestion
);

// --- Thống kê 1 câu hỏi (mục 4.1.7) ---
router.get(
  '/:questionId/stats',
  adminOnly,
  surveyQuestionOptionValidator.questionIdParam,
  surveyAnswerController.statsByQuestion
);

export default router;
