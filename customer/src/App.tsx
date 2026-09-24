import { RequireAuth, RequireGuest } from '@/components/AuthGate';
import { TabBar } from '@/components/TabBar';
import { AppColors } from '@/constants/appTheme';
import { AuthProvider } from '@/context/AuthContext';
import LoginPage from '@/pages/auth/Login';
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
import { Navigate, Route, Routes } from 'react-router-dom';

/** Khung có thanh tab dưới cùng (thay cho mobile/src/app/tabs/_layout.tsx). */
function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/tabs" replace />} />

          {/* Nhóm auth — chỉ vào được khi CHƯA đăng nhập */}
          <Route path="/auth/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/auth/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />

          {/* Nhóm app chính — bắt buộc đăng nhập */}
          <Route path="/tabs" element={<RequireAuth><TabsLayout><HomePage /></TabsLayout></RequireAuth>} />
          <Route path="/tabs/products" element={<RequireAuth><TabsLayout><ProductsPage /></TabsLayout></RequireAuth>} />
          <Route path="/tabs/surveys" element={<RequireAuth><TabsLayout><SurveysPage /></TabsLayout></RequireAuth>} />
          <Route path="/tabs/feedbacks" element={<RequireAuth><TabsLayout><FeedbacksPage /></TabsLayout></RequireAuth>} />
          <Route path="/tabs/profile" element={<RequireAuth><TabsLayout><ProfilePage /></TabsLayout></RequireAuth>} />

          {/* Màn con — có nút quay lại, không có tab bar */}
          <Route path="/product/:id" element={<RequireAuth><ProductDetailPage /></RequireAuth>} />
          <Route path="/survey/:id" element={<RequireAuth><SurveyFormPage /></RequireAuth>} />
          <Route path="/feedback/create" element={<RequireAuth><FeedbackCreatePage /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/tabs" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
