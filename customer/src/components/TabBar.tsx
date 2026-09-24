import { AppColors } from '@/constants/appTheme';
import { Home, Grid, Clipboard, MessageCircle, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/tabs', label: 'Trang chủ', icon: Home, end: true },
  { to: '/tabs/products', label: 'Sản phẩm', icon: Grid },
  { to: '/tabs/surveys', label: 'Khảo sát', icon: Clipboard },
  { to: '/tabs/feedbacks', label: 'Đánh giá', icon: MessageCircle },
  { to: '/tabs/profile', label: 'Cá nhân', icon: User },
];

/** Thanh điều hướng dưới cùng cho web (thay cho Tabs của expo-router). */
export function TabBar() {
  return (
    <nav style={{
      display: 'flex', borderTop: `1px solid ${AppColors.border}`, background: AppColors.surface,
      position: 'sticky', bottom: 0, zIndex: 10,
    }}>
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: '8px 0 10px', color: isActive ? AppColors.accent : AppColors.textSecondary,
        })}>
          <Icon size={22} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
