import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DialogHost from './components/DialogHost';
import { useAuthStore } from './store/useAuthStore';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const roleName = useAuthStore((s) => s.roleName);

  // Tên tab trình duyệt theo vai trò: "Ouran Manager" / "Ouran Admin"
  useEffect(() => {
    document.title = roleName === 'Manager' ? 'Ouran Manager' : 'Ouran Admin';
  }, [roleName]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <DialogHost />
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Outlet />
      </div>
    </div>
  );
}

export default App;