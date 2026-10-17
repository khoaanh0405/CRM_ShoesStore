import { customerPreferenceService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const customerPreferenceController = {
  async listByCustomer(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    res.json(await customerPreferenceService.listByCustomer(customerId, req.user));
  },

  /** POST /api/customers/:customerId/preferences — body { categoryId } */
  async add(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    const preference = await customerPreferenceService.add(customerId, req.body.categoryId, req.user);
    res.status(201).json(preference);
  },

  /** PUT /api/preferences/:id — body { categoryId } */
  async update(req, res) {
    const preferenceId = parseId(req.params.id, 'preferenceId');
    res.json(await customerPreferenceService.update(preferenceId, req.body.categoryId, req.user));
  },

  async remove(req, res) {
    const preferenceId = parseId(req.params.id, 'preferenceId');
    await customerPreferenceService.remove(preferenceId, req.user);
    res.status(204).send();
  },
};

export default customerPreferenceController;
