import { DialogHost } from '@/components/DialogHost';
import { LoginRequired } from '@/components/LoginRequired';
import { RequireAuth, RequireGuest } from '@/components/AuthGate';
import { SiteLayout } from '@/components/SiteLayout';
import { AppColors } from '@/constants/appTheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { usePresence } from '@/hooks/usePresence';
import LoginPage from '@/pages/auth/Login';
import ForgotPasswordPage from '@/pages/auth/ForgotPassword';
import ResetPasswordPage from '@/pages/auth/ResetPassword';
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
import { ClipboardList, Loader2, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Trang cần đăng nhập (hồ sơ, thông báo, làm khảo sát...) — chưa đăng nhập thì chuyển sang trang đăng nhập
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
 * Tab Khảo sát / Đánh giá: khách chưa đăng nhập vẫn vào được trang (giữ header,
 * menu, footer) nhưng nội dung là khối "cần đăng nhập" kèm nút dẫn tới đăng nhập.
 */
function GatedTab({ page, icon, message }: { page: ReactNode; icon: typeof ClipboardList; message: string }) {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Loader2 size={32} color={AppColors.accent} className="spin" />
      </div>
    );
  }
  if (status === 'signedOut') return <LoginRequired icon={icon} message={message} />;
  return <>{page}</>;
}

const gate = (page: ReactNode, icon: typeof ClipboardList, message: string) => (
  <SiteLayout>
    <GatedTab page={page} icon={icon} message={message} />
  </SiteLayout>
);

/**
 * Đăng nhập/Đăng ký/Quên mật khẩu dùng chung SiteLayout (header, menu,
 * breadcrumb, footer) — chỉ phần nội dung là thẻ "auth-card" 2 cột.
 */
const authPage = (page: ReactNode) => (
  <RequireGuest>
    <SiteLayout>
      <div className="auth-page">
        <div className="auth-card">{page}</div>
      </div>
    </SiteLayout>
  </RequireGuest>
);

/** Gửi heartbeat "đang online" cho cả khách đã đăng nhập lẫn khách vãng lai. */
function PresenceTracker() {
  usePresence();
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <PresenceTracker />
      <DialogHost />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/tabs" replace />} />

          <Route path="/auth/login" element={authPage(<LoginPage />)} />
          <Route path="/auth/register" element={authPage(<RegisterPage />)} />
          <Route path="/auth/forgot-password" element={authPage(<ForgotPasswordPage />)} />
          <Route path="/auth/reset-password" element={authPage(<ResetPasswordPage />)} />

          <Route path="/tabs" element={open(<HomePage />)} />
          <Route path="/tabs/products" element={open(<ProductsPage />)} />
          <Route path="/product/:id" element={open(<ProductDetailPage />)} />

          <Route path="/tabs/surveys" element={gate(<SurveysPage />, ClipboardList, 'Đăng nhập để xem các khảo sát dành cho bạn và chia sẻ ý kiến về sản phẩm.')} />
          <Route path="/tabs/feedbacks" element={gate(<FeedbacksPage />, MessageCircle, 'Đăng nhập để gửi đánh giá sản phẩm và theo dõi các phản hồi bạn đã gửi.')} />
          <Route path="/tabs/profile" element={guard(<ProfilePage />)} />
          <Route path="/survey/:id" element={guard(<SurveyFormPage />, true)} />
          <Route path="/feedback/create" element={guard(<FeedbackCreatePage />, true)} />
          <Route path="/feedback/:id/edit" element={guard(<FeedbackCreatePage />, true)} />
          <Route path="/notifications" element={guard(<NotificationsPage />, true)} />

          <Route path="*" element={<Navigate to="/tabs" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
