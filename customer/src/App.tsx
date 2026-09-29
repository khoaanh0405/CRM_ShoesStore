import { RequireAuth, RequireGuest } from '@/components/AuthGate';
import { SiteLayout } from '@/components/SiteLayout';
import { AuthProvider } from '@/context/AuthContext';
import { usePresence } from '@/hooks/usePresence';
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

/**
 * Đăng nhập/Đăng ký/Quên mật khẩu vẫn dùng chung SiteLayout (header, menu,
 * breadcrumb, footer) như mọi trang khác trong web — chỉ có phần nội dung
 * là thẻ "auth-card" 2 cột quen thuộc — để không cảm giác như một màn hình
 * tách biệt, đồng thời RequireGuest vẫn đảm bảo khách đã đăng nhập không
 * vào lại được các trang này.
 */
const authPage = (page: ReactNode) => (
  <RequireGuest>
    <SiteLayout narrow>
      <div className="auth-page">
        <div className="auth-card">{page}</div>
      </div>
    </SiteLayout>
  </RequireGuest>
);

/** Gửi heartbeat "đang online" cho cả khách đã đăng nhập lẫn khách vãng lai (vd. đang ở trang đăng nhập/đăng ký). */
function PresenceTracker() {
  usePresence();
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <PresenceTracker />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/tabs" replace />} />

          <Route path="/auth/login" element={authPage(<LoginPage />)} />
          <Route path="/auth/register" element={authPage(<RegisterPage />)} />
          <Route path="/auth/forgot-password" element={authPage(<ForgotPasswordPage />)} />

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
