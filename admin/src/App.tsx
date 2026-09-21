import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Header toggleSidebar={toggleSidebar} />
        <Outlet />
      </div>
    </div>
  );
}

export default App;