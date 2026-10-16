import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Star,
  FileText,
  LayoutDashboard,
  UserRound,
  History,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_NAMES } from '../config/constants';
import api from '../services/api';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

const adminMenu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Quản lý tài khoản', icon: Users },
  { to: '/audit-logs', label: 'Nhật ký hoạt động', icon: History },
];

const managerMenu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customers', label: 'Quản lý khách hàng', icon: UserRound },
  { to: '/feedbacks', label: 'Quản lý đánh giá', icon: Star },
  { to: '/surveys', label: 'Quản lý khảo sát', icon: FileText },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const roleName = useAuthStore((s) => s.roleName);
  const menu = roleName === ROLE_NAMES.MANAGER ? managerMenu : adminMenu;
  const title = roleName === ROLE_NAMES.MANAGER ? 'Manager' : 'Admin';

  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<string>(title);

  useEffect(() => {
    api.get('/employees/me').then(res => {
      const data = res.data?.data ?? res.data;
      if (data?.fullName) setUserName(data.fullName);
      if (data?.roleName) setUserRole(data.roleName);
      else if (roleName) setUserRole(roleName === ROLE_NAMES.MANAGER ? 'Manager' : 'Admin');
    }).catch(() => {
      setUserRole(roleName === ROLE_NAMES.MANAGER ? 'Manager' : 'Admin');
    });
  }, [roleName]);

  const initial = userName ? userName.charAt(0).toUpperCase() : (title ? title.charAt(0).toUpperCase() : 'U');

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>{title}</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menu.map(({ to, label, icon: Icon, end }) => (
            <li className="nav-item" key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Khối hồ sơ cá nhân ở cuối sidebar (giống ảnh 2) */}
      <div className="sidebar-footer">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-user-card ${isActive ? 'active' : ''}`}>
          <div className="user-avatar">
            {initial}
          </div>
          <div className="user-meta">
            <b>{userName || title}</b>
            <small>{userRole}</small>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;