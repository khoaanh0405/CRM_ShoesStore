import React, { useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import logo from '../../assets/images/logo.png';
import './Header.css';

interface HeaderProps {
  toggleSidebar: () => void;
}

/** Trái: nút menu + "Xin chào, tên". Phải: logo OURAN. Đăng xuất nằm ở cuối sidebar. */
const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const loadProfile = useProfileStore((s) => s.load);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const displayName = profile?.fullName || user?.username || 'bạn';

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} title="Mở/đóng menu">
          <Menu size={24} />
        </button>
        <span className="header-greeting">Xin chào, <b>{displayName}</b></span>
      </div>
      <div className="header-brand">
        <span className="brand-logo">
          <img src={logo} alt="OURAN Logo" className="brand-logo-img" />
        </span>
        <span className="brand-name">OURAN</span>
      </div>
    </header>
  );
};

export default Header;