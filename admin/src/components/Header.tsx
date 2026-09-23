import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import { useAuthStore } from '../store/useAuthStore';
import { Menu, LogOut, LayoutDashboard } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const roleName = useAuthStore((s) => s.roleName);

  const displayName = user?.username ?? 'User';
  const roleLabel = roleName === 'Manager' ? 'Quản lý CRM' : roleName === 'Admin' ? 'Admin' : roleName ?? '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} title="Mở/đóng menu">
          <Menu size={20} />
        </button>
        <div className="header-brand">
          <LayoutDashboard size={20} className="brand-icon" />
          <span className="brand-name">CRM Shoes Store</span>
        </div>
      </div>
      <div className="header-right">
        <div className="user-profile" onClick={() => navigate('/profile')} title="Hồ sơ cá nhân">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=21b964&color=fff`}
            alt="User Avatar"
            className="avatar"
          />
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            {roleLabel && <span className="user-role">{roleLabel}</span>}
          </div>
        </div>
        <div className="header-divider" />
        <button className="logout-btn" onClick={handleLogout} title="Đăng xuất">
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};

export default Header;