import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';
import { useAuthStore } from '../store/useAuthStore';
import type { RoleName } from '../config/constants';

interface Props {
  allow?: RoleName[];
}

const ProtectedRoute: React.FC<Props> = ({ allow }) => {
  // Đăng ký theo dõi store để route tự cập nhật khi vai trò/phiên thay đổi.
  const roleName = useAuthStore((s) => s.roleName);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (allow && roleName && !allow.includes(roleName)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
