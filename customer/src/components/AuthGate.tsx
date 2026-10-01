import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppColors } from '@/constants/appTheme';
import { Loader2 } from 'lucide-react';

/**
 * Route guard: dựa vào trạng thái đăng nhập để điều hướng giữa nhóm /auth
 * và app chính /tabs (thay cho AuthGate trong mobile/src/app/_layout.tsx).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={32} color={AppColors.accent} className="spin" />
      </div>
    );
  }
  if (status === 'signedOut') {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'signedIn') return <Navigate to="/tabs" replace />;
  return <>{children}</>;
}
