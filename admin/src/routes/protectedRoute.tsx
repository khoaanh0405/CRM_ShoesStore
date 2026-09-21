import { Navigate, Outlet } from 'react-router-dom';

/**
 * Bảo vệ các route cần auth.
 * Kiểm tra token trong localStorage (được lưu bởi LoginPage sau khi đăng nhập thành công).
 * Nếu không có token → redirect về /login.
 */
const ProtectedRoute = () => {
  const token = localStorage.getItem('adminToken');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
