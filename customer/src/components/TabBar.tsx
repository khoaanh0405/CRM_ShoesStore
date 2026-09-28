import { AppColors } from '@/constants/appTheme';
import { SITE } from '@/constants/site';
import { useAuth } from '@/context/AuthContext';
import { Clipboard, Grid, Home, LogIn, MessageCircle, Phone, RefreshCw, Search, ShieldCheck, Truck, User, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';

const TABS = [
  { to: '/tabs', label: 'Trang chủ', icon: Home, end: true },
  { to: '/tabs/products', label: 'Sản phẩm', icon: Grid },
  { to: '/tabs/surveys', label: 'Khảo sát', icon: Clipboard },
  { to: '/tabs/feedbacks', label: 'Đánh giá', icon: MessageCircle },
];
const cls = ({ isActive }: { isActive: boolean }) => 'nav-link' + (isActive ? ' active' : '');

export function TabBar() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const signedIn = status === 'signedIn';

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const k = query.trim();
    navigate(k ? `/tabs/products?keyword=${encodeURIComponent(k)}` : '/tabs/products');
  };

  const pill = { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 999, fontWeight: 700, fontSize: 15 } as const;

  return (
    <>
      <header className="nav-top">
        <div className="nav-top-inner">
          <Link to="/tabs" className="brand" aria-label={SITE.name}><Logo height={80} /></Link>

          <form className="header-search" onSubmit={handleSearch} role="search">
            <Search size={20} color={AppColors.textSecondary} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên giày, thương hiệu..." aria-label="Tìm kiếm sản phẩm" />
            <button type="submit">Tìm</button>
          </form>

          <a className="header-hotline" href={`tel:${SITE.hotlineRaw}`}>
            <span className="hotline-icon"><Phone size={20} /></span>
            <span><small>Hotline</small><strong>{SITE.hotline}</strong></span>
          </a>

          <div className="header-actions">
            {signedIn ? (
              <>
                <NotificationBell />
                <Link to="/tabs/profile" className="icon-btn dark" aria-label="Hồ sơ người dùng" title="Hồ sơ người dùng"><User size={22} /></Link>
              </>
            ) : (
              <>
                <Link to="/auth/register" style={{ ...pill, border: `1px solid ${AppColors.border}`, color: AppColors.textPrimary }}><UserPlus size={18} /> Đăng ký</Link>
                <Link to="/auth/login" style={{ ...pill, background: AppColors.accent, color: AppColors.accentText }}><LogIn size={18} /> Đăng nhập</Link>
              </>
            )}
          </div>
        </div>

        <div className="nav-sub">
          <div className="nav-sub-inner">
            <nav className="nav-top-links">
              {TABS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={cls}><Icon size={20} />{label}</NavLink>
              ))}
            </nav>
            <div className="nav-note">
              <span><ShieldCheck size={16} /> Hàng chính hãng</span>
              <span><RefreshCw size={16} /> Đổi trả 7 ngày</span>
              <span><Truck size={16} /> Giao hàng toàn quốc</span>
            </div>
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
