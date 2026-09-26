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

// Đổi từ localStorage -> sessionStorage: phiên đăng nhập chỉ tồn tại trong
// tab/trình duyệt hiện tại, tự động "quên" khi đóng trình duyệt — không
// còn lưu đăng nhập vĩnh viễn như trước.
const stored = sessionStorage.getItem('user');

export const useAuthStore = create<AuthState>((set) => ({
  user: stored ? JSON.parse(stored) : null,
  roleName: stored ? JSON.parse(stored).role?.roleName ?? null : null,
  setUser: (user) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ user, roleName: user.role?.roleName ?? null });
  },
  clear: () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    set({ user: null, roleName: null });
  },
}));

export const isAdmin = () => useAuthStore.getState().roleName === ROLE_NAMES.ADMIN;
export const isManager = () => useAuthStore.getState().roleName === ROLE_NAMES.MANAGER;