import React, { useEffect, useState } from 'react';
import StatCard from '../../components/StatCard';
import { getDashboardStats } from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Package, Star, FileText } from 'lucide-react';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    pendingFeedbacks: 0,
    activeSurveys: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        toast.error('Không thể lấy dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="page-title">Dashboard Tổng Quan</h1>
            <p className="hero-date">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
        ) : (
          <div className="stats-container">
            <StatCard icon={Users} label="Khách hàng" value={stats.totalCustomers} />
            <StatCard icon={Package} label="Sản phẩm" value={stats.totalProducts} />
            <StatCard icon={Star} label="Phản hồi mới" value={stats.pendingFeedbacks} />
            <StatCard icon={FileText} label="Khảo sát" value={stats.activeSurveys} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;