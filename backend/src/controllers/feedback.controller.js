import { feedbackService } from '../services/index.js';
import { parseId, parseNumber } from '../utils/index.js';
import { ForbiddenError, ConflictError } from '../errors/AppError.js';
import { ROLE_NAMES, FEEDBACK_STATUS } from '../constants/index.js';

export const feedbackController = {
  /** GET /api/feedbacks?status=&productId=&customerId= */
  async list(req, res) {
    res.json(await feedbackService.list({
      status: req.query.status,
      productId: parseNumber(req.query.productId),
      customerId: parseNumber(req.query.customerId),
    }));
  },

  async getById(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    res.json(await feedbackService.getById(feedbackId));
  },

  async listByCustomer(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    res.json(await feedbackService.listByCustomer(customerId));
  },

  async listByProduct(req, res) {
    const productId = parseId(req.params.productId, 'productId');
    res.json(await feedbackService.listByProduct(productId));
  },

  async create(req, res) {
    const { customerId, productId, title, content, rating, imageUrl } = req.body;
    const feedback = await feedbackService.create({
      customerId, productId, title, content, rating, imageUrl,
    });
    res.status(201).json(feedback);
  },

  async update(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    const { title, content, rating, imageUrl } = req.body;
    res.json(await feedbackService.update(feedbackId, { title, content, rating, imageUrl }));
  },

  async updateStatus(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');
    res.json(await feedbackService.updateStatus(feedbackId, req.body.status));
  },

  async remove(req, res) {
    const feedbackId = parseId(req.params.id, 'feedbackId');

    if (req.user?.roleName === ROLE_NAMES.CUSTOMER) {
      const fb = await feedbackService.getById(feedbackId);
      if (fb.customerId !== req.user.customerId) {
        throw new ForbiddenError('Bạn chỉ được thu hồi đánh giá của chính mình.');
      }
      if (fb.status !== FEEDBACK_STATUS.PENDING) {
        throw new ConflictError('Chỉ thu hồi được đánh giá đang chờ duyệt.');
      }
    }

    await feedbackService.remove(feedbackId);
    res.status(204).send();
  },
};

export default feedbackController;