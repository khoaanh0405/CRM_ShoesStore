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
