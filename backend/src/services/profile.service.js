/**
 * Hồ sơ cá nhân của nhân sự (Admin/Manager).
 *
 * Bản cũ đọc/ghi họ tên, SĐT, ngày sinh, địa chỉ trực tiếp trên bảng accounts — các cột này không còn trong
 * schema (đã chuyển sang bảng employees với firstName/lastName). Nay ủy quyền hoàn toàn cho employeeService
 * để chỉ có MỘT nơi xử lý họ/tên, kiểm tra email trùng và đồng bộ email giữa accounts <-> employees.
 */
import { employeeService } from './employee.service.js';

export const profileService = {
  getMe(accountId) {
    return employeeService.getMe(accountId);
  },
  /** data: { firstName, lastName, email, phone, dateOfBirth, gender, address } (mọi trường đều tùy chọn). */
  updateMe(accountId, data) {
    return employeeService.updateMe(accountId, data);
  },
};
export default profileService;
