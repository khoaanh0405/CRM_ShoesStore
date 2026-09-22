import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Package, Star, FileText, LayoutDashboard } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>Admin</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {/* Tab này do thành viên khác phụ trách */}
          <li className="nav-item">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/accounts" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              <span>Quản lý tài khoản</span>
            </NavLink>
          </li>
          {/* Tab này do thành viên khác phụ trách */}
          <li className="nav-item">
            <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Package size={20} />
              <span>Quản lý sản phẩm & nhà cung cấp</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/feedbacks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Star size={20} />
              <span>Quản lý đánh giá</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/surveys" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Quản lý khảo sát</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
