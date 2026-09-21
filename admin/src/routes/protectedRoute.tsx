import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../services/auth';

const ProtectedRoute: React.FC = () => {
  if (!isAuthenticated()) {
    // Nếu chưa đăng nhập, chuyển hướng về trang login
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, render các component con (Dashboard, AccountManagement...)
  return <Outlet />;
};

export default ProtectedRoute;