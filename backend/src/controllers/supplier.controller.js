import { supplierService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const supplierController = {
  async list(req, res) {
    res.json(await supplierService.list());
  },

  /** Tìm kiếm nâng cao theo tên; không truyền keyword thì trả toàn bộ. */
  async search(req, res) {
    res.json(await supplierService.search(req.query.keyword));
  },

  async getById(req, res) {
    const supplierId = parseId(req.params.id, 'supplierId');
    res.json(await supplierService.getById(supplierId));
  },

  async getWithProducts(req, res) {
    const supplierId = parseId(req.params.id, 'supplierId');
    res.json(await supplierService.getWithProducts(supplierId));
  },

  async create(req, res) {
    const { supplierName, phone, email, address } = req.body;
    const supplier = await supplierService.create({ supplierName, phone, email, address });
    res.status(201).json(supplier);
  },

  async update(req, res) {
    const supplierId = parseId(req.params.id, 'supplierId');
    const { supplierName, phone, email, address } = req.body;
    res.json(await supplierService.update(supplierId, { supplierName, phone, email, address }));
  },

  async remove(req, res) {
    const supplierId = parseId(req.params.id, 'supplierId');
    await supplierService.remove(supplierId);
    res.status(204).send();
  },
};

export default supplierController;
