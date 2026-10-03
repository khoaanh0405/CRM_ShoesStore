import api from '../utils/api';
import { useAuthStore, isStaffRole } from '../store/useAuthStore';

export const login = async (username: string, password: string) => {
  const response = await api.post('/accounts/login', { username, password });
  const account = response.data?.account;

  // Chặn Customer (và mọi vai trò khác Admin/Manager): không lưu token, không lưu user.
  if (!isStaffRole(account?.role?.roleName)) {
    useAuthStore.getState().clear();
    throw new Error('Tài khoản khách hàng không thể đăng nhập vào trang quản trị.');
  }

  if (response.data?.token) {
    sessionStorage.setItem('token', response.data.token);
    useAuthStore.getState().setUser(account);
  }
  return response.data;
};

export const logout = () => useAuthStore.getState().clear();

// Đã đăng nhập hợp lệ = có token VÀ có user với vai trò quản trị.
export const isAuthenticated = () =>
  !!sessionStorage.getItem('token') && isStaffRole(useAuthStore.getState().roleName);
