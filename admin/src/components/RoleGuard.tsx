import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { RoleName } from '../config/constants';

const RoleGuard = ({ allow, children }: { allow: RoleName[]; children: ReactNode }) => {
  const roleName = useAuthStore((s) => s.roleName);
  if (roleName && !allow.includes(roleName)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default RoleGuard;