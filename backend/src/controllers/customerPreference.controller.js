import { customerPreferenceService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const customerPreferenceController = {
  async listByCustomer(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    res.json(await customerPreferenceService.listByCustomer(customerId));
  },

  async add(req, res) {
    const customerId = parseId(req.params.customerId, 'customerId');
    const preference = await customerPreferenceService.add(customerId, req.body.preferenceTag);
    res.status(201).json(preference);
  },

  async update(req, res) {
    const preferenceId = parseId(req.params.id, 'preferenceId');
    res.json(await customerPreferenceService.update(preferenceId, req.body.preferenceTag));
  },

  async remove(req, res) {
    const preferenceId = parseId(req.params.id, 'preferenceId');
    await customerPreferenceService.remove(preferenceId);
    res.status(204).send();
  },
};

export default customerPreferenceController;
