/**
 * Controller cho Role. Nhiệm vụ: đọc req (params/query/body) -> gọi Service
 * -> trả res JSON. KHÔNG chứa business logic (validate nghiệp vụ, kiểm tra
 * tồn tại... đều nằm ở roleService).
 *
 * Express 5 tự động bắt promise rejection của async handler và chuyển xuống
 * error-handling middleware trong app.js, nên không cần try/catch ở đây —
 * lỗi AppError từ Service sẽ tự được map ra đúng statusCode.
 */
import { roleService } from '../services/index.js';
import { parseId } from '../utils/index.js';

export const roleController = {
  async list(req, res) {
    res.json(await roleService.list());
  },

  async getById(req, res) {
    const roleId = parseId(req.params.id, 'roleId');
    res.json(await roleService.getById(roleId));
  },

  async create(req, res) {
    const { roleName, description } = req.body;
    const role = await roleService.create({ roleName, description });
    res.status(201).json(role);
  },

  async update(req, res) {
    const roleId = parseId(req.params.id, 'roleId');
    const { roleName, description } = req.body;
    res.json(await roleService.update(roleId, { roleName, description }));
  },

  async remove(req, res) {
    const roleId = parseId(req.params.id, 'roleId');
    await roleService.remove(roleId);
    res.status(204).send();
  },
};

export default roleController;
