import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_NAMES } from '../config/constants';

export const login = async (username: string, password: string) => {
  const response = await api.post('/accounts/login', { username, password });
  const account = response.data?.account;
  const roleName = account?.role?.roleName;

  if (roleName !== ROLE_NAMES.ADMIN && roleName !== ROLE_NAMES.MANAGER) {
    throw new Error('Tài khoản không có quyền truy cập trang quản trị.');
  }

  if (response.data?.token) {
    // Đổi từ localStorage -> sessionStorage (xem giải thích ở useAuthStore.ts)
    sessionStorage.setItem('token', response.data.token);
    useAuthStore.getState().setUser(account);
  }
  return response.data;
};

export const logout = () => useAuthStore.getState().clear();

export const isAuthenticated = () => !!sessionStorage.getItem('token');