/**
 * Gom toàn bộ route con vào 1 router duy nhất, được app.js mount tại '/api'.
 * => URL cuối cùng = '/api' + prefix bên dưới + path trong từng file route.
 *    Ví dụ: '/api' + '/surveys' + '/:surveyId/submit'
 *           = POST /api/surveys/3/submit
 */
import { Router } from 'express';

import roleRoutes from './role.routes.js';
import accountRoutes from './account.routes.js';
import supplierRoutes from './supplier.routes.js';
import productRoutes from './product.routes.js';
import customerRoutes from './customer.routes.js';
import preferenceRoutes from './preference.routes.js';
import feedbackRoutes from './feedback.routes.js';
import surveyRoutes from './survey.routes.js';
import surveyQuestionRoutes from './surveyQuestion.routes.js';
import surveyQuestionOptionRoutes from './surveyQuestionOption.routes.js';
import surveyResponseRoutes from './surveyResponse.routes.js';

const router = Router();

router.use('/roles', roleRoutes);
router.use('/accounts', accountRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/preferences', preferenceRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/surveys', surveyRoutes);
router.use('/questions', surveyQuestionRoutes);
router.use('/options', surveyQuestionOptionRoutes);
router.use('/responses', surveyResponseRoutes);

export default router;
