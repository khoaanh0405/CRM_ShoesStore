import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AccountManagement from './pages/AccountManagement';
import Login from './pages/Login';
import ProtectedRoute from './routes/protectedRoute';
import './App.css';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Các route cần đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/*"
          element={
            <div className="app-container">
              <Sidebar isOpen={isSidebarOpen} />
              <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <Header toggleSidebar={toggleSidebar} />
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={<AccountManagement />} />
                </Routes>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;