import { productService } from '../services/index.js';
import { parseId, parseBoolean, parseNumber } from '../utils/index.js';

export const productController = {
  /** GET /api/products?includeInactive=true — mặc định chỉ lấy sản phẩm đang bán. */
  async list(req, res) {
    const includeInactive = parseBoolean(req.query.includeInactive) ?? false;
    res.json(await productService.list({ includeInactive }));
  },

  /**
   * Tìm kiếm nâng cao / lọc / sắp xếp (mục II.2).
   * Query: keyword, category, brand, minPrice, maxPrice, isActive, sortBy, sortOrder.
   */
  async search(req, res) {
    const { keyword, category, brand, sortBy, sortOrder } = req.query;
    res.json(await productService.search({
      keyword,
      category,
      brand,
      minPrice: parseNumber(req.query.minPrice),
      maxPrice: parseNumber(req.query.maxPrice),
      isActive: parseBoolean(req.query.isActive),
      sortBy,
      sortOrder,
    }));
  },

  async getById(req, res) {
    const productId = parseId(req.params.id, 'productId');
    res.json(await productService.getById(productId));
  },

  async listBySupplier(req, res) {
    const supplierId = parseId(req.params.supplierId, 'supplierId');
    res.json(await productService.listBySupplier(supplierId));
  },

  async create(req, res) {
    const product = await productService.create(req.body);
    res.status(201).json(product);
  },

  async update(req, res) {
    const productId = parseId(req.params.id, 'productId');
    res.json(await productService.update(productId, req.body));
  },

  /** PATCH /api/products/:id/active — body { isActive: true|false }. */
  async setActive(req, res) {
    const productId = parseId(req.params.id, 'productId');
    const isActive = parseBoolean(req.body.isActive);
    res.json(await productService.setActive(productId, isActive));
  },

  async remove(req, res) {
    const productId = parseId(req.params.id, 'productId');
    await productService.setActive(productId, false);
    res.status(204).send();
  },
};

export default productController;
