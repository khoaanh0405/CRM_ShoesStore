import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import LoginPage from '../pages/login/LoginPage';
import ProtectedRoute from './protectedRoute';
import RoleGuard from '../components/RoleGuard';
import RoleDashboard from '../pages/login/RoleDashboard';
import { ROLE_NAMES } from '../config/constants';

import AccountManagement from '../pages/admin/AccountManagement';
import ProfilePage from '../pages/login/ProfilePage';
import AuditLogsPage from '../pages/admin/AuditLogsPage';

import CustomersPage from '../pages/manager/CustomersPage';
import FeedbacksPage from '../pages/manager/FeedbacksPage';
import SurveysPage from '../pages/manager/SurveysPage';
import SurveyDetailPage from '../pages/manager/SurveyDetailPage';
import CustomerReport from '../pages/manager/CustomerReport';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />, // layout có Header + Sidebar + <Outlet />
        children: [
          { index: true, element: <RoleDashboard /> },
          { path: 'profile', element: <ProfilePage /> },

          // --- Admin ---
          { path: 'accounts', element: <RoleGuard allow={[ROLE_NAMES.ADMIN]}><AccountManagement /></RoleGuard> },
          { path: 'audit-logs', element: <RoleGuard allow={[ROLE_NAMES.ADMIN]}><AuditLogsPage /></RoleGuard> },

          // --- Manager ---
          { path: 'customers', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><CustomersPage /></RoleGuard> },
          { path: 'feedbacks', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><FeedbacksPage /></RoleGuard> },
          { path: 'surveys', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><SurveysPage /></RoleGuard> },
          { path: 'surveys/:surveyId', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><SurveyDetailPage /></RoleGuard> },
          { path: 'reports', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><CustomerReport /></RoleGuard> },

          // Đường dẫn không tồn tại -> về trang chủ (luôn để cuối)
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export default router;