import { AppColors } from '@/constants/appTheme';
import { useAuth } from '@/context/AuthContext';
import { initialOf } from '@/utils/format';
import { Clipboard, Grid, Home, LogIn, MessageCircle, User, UserPlus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

const TABS = [
  { to: '/tabs', label: 'Trang chủ', icon: Home, end: true },
  { to: '/tabs/products', label: 'Sản phẩm', icon: Grid },
  { to: '/tabs/surveys', label: 'Khảo sát', icon: Clipboard },
  { to: '/tabs/feedbacks', label: 'Đánh giá', icon: MessageCircle },
  { to: '/tabs/profile', label: 'Cá nhân', icon: User },
];
const cls = ({ isActive }: { isActive: boolean }) => 'nav-link' + (isActive ? ' active' : '');

export function TabBar() {
  const { account, status } = useAuth();
  const signedIn = status === 'signedIn';
  const name = account?.customer?.fullName ?? account?.username ?? '';

  return (
    <>
      <header className="nav-top">
        <div className="nav-top-inner">
          <Link to="/tabs" className="brand">CRM ShoesStore</Link>
          <nav className="nav-top-links">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={cls}><Icon size={18} />{label}</NavLink>
            ))}
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {signedIn ? (
              <>
                <NotificationBell />
                <Link to="/tabs/profile" aria-label="Trang cá nhân" style={{
                  width: 40, height: 40, borderRadius: 20, background: AppColors.accent, color: AppColors.accentText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                }}>{initialOf(name)}</Link>
              </>
            ) : (
              <>
                <Link to="/auth/register" style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20,
                  border: `1px solid ${AppColors.border}`, color: AppColors.textPrimary, fontWeight: 700, fontSize: 14,
                }}>
                  <UserPlus size={16} /> Đăng ký
                </Link>
                <Link to="/auth/login" style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20,
                  background: AppColors.accent, color: AppColors.accentText, fontWeight: 700, fontSize: 14,
                }}>
                  <LogIn size={16} /> Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <nav className="nav-bottom">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={22} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}