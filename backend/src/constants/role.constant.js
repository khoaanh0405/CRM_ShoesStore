/**
 * Tên các Role cố định trong hệ thống (bảng roles.role_name).
 * Dùng thay cho việc gõ tay chuỗi 'Customer'/'Admin' rải rác trong Service
 * (ví dụ account.service.js#registerCustomer() tra role_name = 'Customer').
 */
export const ROLE_NAMES = {
  ADMIN: 'Admin',
  CUSTOMER: 'Customer',
};
