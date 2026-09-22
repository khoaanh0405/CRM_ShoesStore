import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { getDashboardStats } from '../services/api';
import toast from 'react-hot-toast';
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
          <h1 className="page-title">Dashboard Tổng Quan</h1>
          <p>Xem thống kê nhanh về hệ thống CRM Shoes Store</p>
        </div>
      </div>
      
      <div className="dashboard-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
        ) : (
          <div className="stats-container">
            <StatCard 
              title="Khách hàng" 
              count={stats.totalCustomers.toString()} 
              completedText="Đang hoạt động" 
              iconType="teams" 
            />
            <StatCard 
              title="Sản phẩm" 
              count={stats.totalProducts.toString()} 
              completedText="Đang kinh doanh" 
              iconType="projects" 
            />
            <StatCard 
              title="Phản hồi mới" 
              count={stats.pendingFeedbacks.toString()} 
              completedText="Chờ xử lý" 
              iconType="tasks" 
            />
            <StatCard 
              title="Khảo sát" 
              count={stats.activeSurveys.toString()} 
              completedText="Đang thu thập" 
              iconType="productivity" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
