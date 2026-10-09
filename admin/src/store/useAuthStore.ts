import { create } from 'zustand';
import { ROLE_NAMES, type RoleName } from '../config/constants';

interface AuthUser {
  accountId: number;
  username: string;
  role?: { roleName: RoleName };
}

interface AuthState {
  user: AuthUser | null;
  roleName: RoleName | null;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

/** Web quản trị chỉ dành cho Admin và Manager. */
const ALLOWED_ROLES: RoleName[] = [ROLE_NAMES.ADMIN, ROLE_NAMES.MANAGER];
export const isStaffRole = (roleName?: string | null): roleName is RoleName =>
  !!roleName && (ALLOWED_ROLES as string[]).includes(roleName);

function clearStorage() {
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
}

// Phiên chỉ tồn tại trong tab hiện tại (sessionStorage). Khi khôi phục phải kiểm tra
// lại vai trò: dữ liệu bị sửa tay hoặc phiên của Customer đều bị xóa ngay.
function readStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (!isStaffRole(user?.role?.roleName)) {
      clearStorage();
      return null;
    }
    return user;
  } catch {
    clearStorage();
    return null;
  }
}

const initial = readStoredUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial,
  roleName: initial?.role?.roleName ?? null,
  setUser: (user) => {
    if (!isStaffRole(user.role?.roleName)) {
      clearStorage();
      set({ user: null, roleName: null });
      return;
    }
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ user, roleName: user.role!.roleName });
  },
  clear: () => {
    clearStorage();
    set({ user: null, roleName: null });
  },
}));

export const isAdmin = () => useAuthStore.getState().roleName === ROLE_NAMES.ADMIN;
export const isManager = () => useAuthStore.getState().roleName === ROLE_NAMES.MANAGER;
