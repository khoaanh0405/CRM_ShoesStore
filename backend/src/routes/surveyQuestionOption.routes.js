/**
 * /api/options — thêm/sửa/xóa lựa chọn của câu hỏi trắc nghiệm.
 * Liệt kê lựa chọn theo câu hỏi nằm ở surveyQuestion.routes.js
 * (/api/questions/:questionId/options).
 *
 * DELETE ở đây luôn an toàn: survey_answers.option_id là ON DELETE SET NULL
 * nên không bị FK chặn, câu trả lời cũ chỉ mất liên kết optionId.
 */
import { Router } from 'express';
import { surveyQuestionOptionController } from '../controllers/index.js';
import { surveyQuestionOptionValidator } from '../validators/index.js';
import { adminOnly } from '../middleware/index.js';

const router = Router();

router.post('/', adminOnly, surveyQuestionOptionValidator.create, surveyQuestionOptionController.create);
router.put(
  '/:id',
  adminOnly,
  surveyQuestionOptionValidator.idParam,
  surveyQuestionOptionValidator.update,
  surveyQuestionOptionController.update
);
router.delete('/:id', adminOnly, surveyQuestionOptionValidator.idParam, surveyQuestionOptionController.remove);

export default router;
