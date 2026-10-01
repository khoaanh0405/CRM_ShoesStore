/**
 * Gom toàn bộ route con, app.js mount tại '/api'.
 */
import { Router } from 'express';
import roleRoutes from './role.routes.js';
import accountRoutes from './account.routes.js';
import adminRoutes from './admin.routes.js';
import supplierRoutes from './supplier.routes.js';
import productRoutes from './product.routes.js';
import customerRoutes from './customer.routes.js';
import preferenceRoutes from './preference.routes.js';
import feedbackRoutes from './feedback.routes.js';
import surveyRoutes from './survey.routes.js';
import surveyQuestionRoutes from './surveyQuestion.routes.js';
import surveyQuestionOptionRoutes from './surveyQuestionOption.routes.js';
import surveyResponseRoutes from './surveyResponse.routes.js';
import notificationRoutes from './notification.routes.js';
import presenceRoutes from './presence.routes.js';

const router = Router();
router.use('/roles', roleRoutes);
router.use('/accounts', accountRoutes);
router.use('/admin', adminRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/preferences', preferenceRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/surveys', surveyRoutes);
router.use('/questions', surveyQuestionRoutes);
router.use('/options', surveyQuestionOptionRoutes);
router.use('/responses', surveyResponseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/presence', presenceRoutes);
export default router;