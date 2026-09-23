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

const stored = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set) => ({
  user: stored ? JSON.parse(stored) : null,
  roleName: stored ? JSON.parse(stored).role?.roleName ?? null : null,
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, roleName: user.role?.roleName ?? null });
  },
  clear: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, roleName: null });
  },
}));

export const isAdmin = () => useAuthStore.getState().roleName === ROLE_NAMES.ADMIN;
export const isManager = () => useAuthStore.getState().roleName === ROLE_NAMES.MANAGER;