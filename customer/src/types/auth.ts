export interface Role { roleId: number; roleName: string; description: string | null; }

export interface Customer {
  customerId: number;
  fullName: string;
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
  customer?: Customer | null;
}

export interface LoginPayload { username: string; password: string; }
export interface LoginResponse { token: string; account: Account; }

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  gender?: string;
  phone?: string;
  address?: string;
}

export interface ApiErrorBody { code: string; message: string; }
