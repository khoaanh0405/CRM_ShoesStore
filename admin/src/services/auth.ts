import api from '../utils/api';

export const login = async (username: string, password: string) => {
  const response = await api.post('/accounts/login', { username, password });
  
  if (response.data && response.data.account) {
    const roleName = response.data.account.role?.roleName;
    if (roleName !== 'Admin') {
      throw new Error('Tài khoản mật khẩu admin sai');
    }
  }

  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token);
    // Lưu thêm thông tin user nếu cần
    if (response.data.account) {
      localStorage.setItem('user', JSON.stringify(response.data.account));
    }
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
