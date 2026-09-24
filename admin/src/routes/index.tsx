import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import LoginPage from '../pages/login/LoginPage';
import ProtectedRoute from './protectedRoute';
import RoleGuard from '../components/RoleGuard';
import RoleDashboard from '../pages/login/RoleDashboard';
import { ROLE_NAMES } from '../config/constants';

import AccountManagement from '../pages/admin/AccountManagement';
import ProductsPage from '../pages/admin/ProductsPage';
import ProfilePage from '../pages/login/ProfilePage';
import ReportsPage from '../pages/admin/ReportsPage';

import CustomersPage from '../pages/manager/CustomersPage';
import FeedbacksPage from '../pages/manager/FeedbacksPage';
import SurveysPage from '../pages/manager/SurveysPage';
import SurveyDetailPage from '../pages/manager/SurveyDetailPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { index: true, element: <RoleDashboard /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'accounts', element: <RoleGuard allow={[ROLE_NAMES.ADMIN]}><AccountManagement /></RoleGuard> },
          { path: 'products', element: <RoleGuard allow={[ROLE_NAMES.ADMIN]}><ProductsPage /></RoleGuard> },
          { path: 'reports', element: <RoleGuard allow={[ROLE_NAMES.ADMIN]}><ReportsPage /></RoleGuard> },   // ← thêm dòng này
          { path: 'customers', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><CustomersPage /></RoleGuard> },
          { path: 'feedbacks', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><FeedbacksPage /></RoleGuard> },
          { path: 'surveys', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><SurveysPage /></RoleGuard> },
          { path: 'surveys/:surveyId', element: <RoleGuard allow={[ROLE_NAMES.MANAGER]}><SurveyDetailPage /></RoleGuard> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export default router;