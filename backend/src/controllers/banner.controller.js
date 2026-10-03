import { bannerService } from '../services/banner.service.js';
import { parseId } from '../utils/index.js';

export const bannerController = {
  async listActive(req, res) {
    res.json(await bannerService.listActive());
  },
  async listAll(req, res) {
    res.json(await bannerService.listAll());
  },
  async create(req, res) {
    res.status(201).json(await bannerService.create(req.body));
  },
  async update(req, res) {
    res.json(await bannerService.update(parseId(req.params.id, 'bannerId'), req.body));
  },
  async setActive(req, res) {
    res.json(await bannerService.setActive(parseId(req.params.id, 'bannerId'), req.body.isActive));
  },
  async remove(req, res) {
    await bannerService.remove(parseId(req.params.id, 'bannerId'));
    res.status(204).send();
  },
};

export default bannerController;