import { RequireAuth, RequireGuest } from '@/components/AuthGate';
import { TabBar } from '@/components/TabBar';
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
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="auth-wrap"><div className="auth-card">{children}</div></div>
);

const guard = (page: ReactNode, narrow = false) => (
  <RequireAuth>
    <TabBar />
    <main className={`container${narrow ? ' narrow' : ''}`}>{page}</main>
  </RequireAuth>
);

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/tabs" replace />} />

          <Route path="/auth/login" element={<RequireGuest><AuthLayout><LoginPage /></AuthLayout></RequireGuest>} />
          <Route path="/auth/register" element={<RequireGuest><AuthLayout><RegisterPage /></AuthLayout></RequireGuest>} />

          <Route path="/tabs" element={guard(<HomePage />)} />
          <Route path="/tabs/products" element={guard(<ProductsPage />)} />
          <Route path="/tabs/surveys" element={guard(<SurveysPage />, true)} />
          <Route path="/tabs/feedbacks" element={guard(<FeedbacksPage />, true)} />
          <Route path="/tabs/profile" element={guard(<ProfilePage />, true)} />

          <Route path="/product/:id" element={guard(<ProductDetailPage />)} />
          <Route path="/survey/:id" element={guard(<SurveyFormPage />, true)} />
          <Route path="/feedback/create" element={guard(<FeedbackCreatePage />, true)} />
          <Route path="/notifications" element={guard(<NotificationsPage />, true)} />

          <Route path="*" element={<Navigate to="/tabs" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}