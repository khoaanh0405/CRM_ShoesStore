/**
 * Kiểu dữ liệu khớp với backend (xem backend/prisma/schema.prisma,
 * account.service.js#sanitize và account.controller.js).
 * accountService.sanitize() luôn loại bỏ passwordHash trước khi trả ra ngoài.
 */

export interface Role {
  roleId: number;
  roleName: string;
  description: string | null;
}

export interface Customer {
  customerId: number;
  fullName: string;
  /** ISO date string do Prisma trả về, vd "2003-05-20T00:00:00.000Z". */
  dateOfBirth: string;
  gender: string | null;
  phone: string | null;
  address: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface Account {
  accountId: number;
  username: string;
  roleId: number;
  isLocked: boolean;
  createdAt: string;
  role?: Role;
  /** Chỉ có khi role là Customer (account.controller.js#register/login). */
  customer?: Customer | null;
}

/** Body cho POST /api/accounts/login (account.validator.js#login). */
export interface LoginPayload {
  username: string;
  password: string;
}

/** Response của POST /api/accounts/login — token do controller phát hành. */
export interface LoginResponse {
  token: string;
  account: Account;
}

/** Body cho POST /api/accounts/register (account.validator.js#register). */
export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  /** Định dạng "YYYY-MM-DD". */
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  address?: string;
}

/** Hình dạng lỗi trả về từ errorHandler.middleware.js: { code, message }. */
export interface ApiErrorBody {
  code: string;
  message: string;
}
