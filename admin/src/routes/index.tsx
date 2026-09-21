import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import Dashboard from '../pages/Dashboard';
import LoginPage from '../pages/LoginPage';
import FeedbacksPage from '../pages/FeedbacksPage';
import SurveysPage from '../pages/SurveysPage';
import SurveyDetailPage from '../pages/SurveyDetailPage';
import ProtectedRoute from './protectedRoute';

const router = createBrowserRouter([
  // Route công khai — không cần token
  {
    path: '/login',
    element: <LoginPage />,
  },
  // Routes được bảo vệ — cần token
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <App />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'feedbacks', element: <FeedbacksPage /> },
          { path: 'surveys', element: <SurveysPage /> },
          { path: 'surveys/:surveyId', element: <SurveyDetailPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export default router;
