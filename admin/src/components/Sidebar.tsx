import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Package, Star, FileText, LayoutDashboard, UserRound } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_NAMES } from '../config/constants';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

import { BarChart3 } from 'lucide-react'; // thêm vào dòng import icon lucide-react hiện có

const adminMenu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Quản lý tài khoản', icon: Users },
  { to: '/products', label: 'Quản lý sản phẩm & nhà cung cấp', icon: Package },
  { to: '/reports', label: 'Tổng quan CRM', icon: BarChart3 },
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
  const title = roleName === ROLE_NAMES.MANAGER ? 'Quản lý CRM' : 'Admin';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>{title}</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menu.map(({ to, label, icon: Icon, end }) => (
            <li className="nav-item" key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;