import { RequireAuth, RequireGuest } from '@/components/AuthGate';
import { SiteLayout } from '@/components/SiteLayout';
import { AuthProvider } from '@/context/AuthContext';
import LoginPage from '@/pages/auth/Login';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword';
import RegisterPage from '@/pages/auth/Register';
import FeedbackCreatePage from '@/pages/FeedbackCreate';
import FeedbacksPage from '@/pages/Feedbacks';
import HomePage from '@/pages/Home';
import NotificationsPage from '@/pages/Notifications';
import ProductDetailPage from '@/pages/ProductDetail';
import ProductsPage from '@/pages/Products';
import ProfilePage from '@/pages/Profile';
import SurveyFormPage from '@/pages/SurveyForm';
import SurveysPage from '@/pages/Surveys';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="auth-wrap"><div className="auth-card">{children}</div></div>
);

// Trang cần đăng nhập (đánh giá, khảo sát, hồ sơ...)
const guard = (page: ReactNode, narrow = false) => (
  <RequireAuth>
    <SiteLayout narrow={narrow}>{page}</SiteLayout>
  </RequireAuth>
);

// Trang công khai: ai cũng xem được (trang chủ, sản phẩm)
const open = (page: ReactNode, narrow = false) => (
  <SiteLayout narrow={narrow}>{page}</SiteLayout>
);

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/tabs" replace />} />

          <Route path="/auth/login" element={<RequireGuest><AuthLayout><LoginPage /></AuthLayout></RequireGuest>} />
          <Route path="/auth/register" element={<RequireGuest><AuthLayout><RegisterPage /></AuthLayout></RequireGuest>} />
          <Route path="/auth/forgot-password" element={<RequireGuest><AuthLayout><ForgotPasswordPage /></AuthLayout></RequireGuest>} />

          <Route path="/tabs" element={open(<HomePage />)} />
          <Route path="/tabs/products" element={open(<ProductsPage />)} />
          <Route path="/product/:id" element={open(<ProductDetailPage />)} />

          <Route path="/tabs/surveys" element={guard(<SurveysPage />)} />
          <Route path="/tabs/feedbacks" element={guard(<FeedbacksPage />)} />
          <Route path="/tabs/profile" element={guard(<ProfilePage />)} />
          <Route path="/survey/:id" element={guard(<SurveyFormPage />, true)} />
          <Route path="/feedback/create" element={guard(<FeedbackCreatePage />, true)} />
          <Route path="/notifications" element={guard(<NotificationsPage />, true)} />

          <Route path="*" element={<Navigate to="/tabs" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
