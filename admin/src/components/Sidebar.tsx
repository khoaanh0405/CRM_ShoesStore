import React from 'react';
import { Users, Package, Star, FileText } from 'lucide-react';
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
          <li className="nav-item">
            <a href="#" className="nav-link active">
              <Users size={20} />
              <span>Quản lý tài khoản</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <Package size={20} />
              <span>Quản lý sản phẩm & nhà cung cấp</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <Star size={20} />
              <span>Quản lý đánh giá</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">
              <FileText size={20} />
              <span>Quản lý khảo sát</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
