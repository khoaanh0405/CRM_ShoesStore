import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input type="text" placeholder="Search" />
        </div>
      </div>
      <div className="header-right">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>
        <div className="user-profile">
          <img 
            src="https://ui-avatars.com/api/?name=Admin+User&background=21b964&color=fff" 
            alt="User Avatar" 
            className="avatar" 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
