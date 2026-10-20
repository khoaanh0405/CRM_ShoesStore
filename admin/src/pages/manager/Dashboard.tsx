import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Wifi, Star, FileText } from 'lucide-react';
import { getCustomers, getFeedbacks, getSurveys, getCustomerReport, getOnlineCustomerCount } from '../../services/api';
import DonutChart from '../../components/DonutChart';
import { RatingStars, FeedbackStatusBadge } from '../../components/FeedbackBits';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNavigate } from 'react-router-dom';
import { fullNameOf } from '../../utils/name';
import { AGE_BUCKETS, REPORT_COLORS, getAge } from '../../utils/customerStats';
import './Dashboard.css';

// Làm mới số khách hàng online mỗi 5 giây (real-time)
const ONLINE_POLL_MS = 5000;

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<{ tag: string; count: number }[]>([]);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  const loadAll = useCallback(async (silent = false) => {
    try {
      const [custs, fbs, svs] = await Promise.all([getCustomers(), getFeedbacks(), getSurveys()]);
      setCustomers(custs);
      setFeedbacks(fbs);
      setSurveys(svs);
      getCustomerReport()
        .then((rpt: any) => setPreferences(rpt?.byPreference ?? []))
        .catch(() => { if (!silent) setPreferences([]); });
    } catch {
      if (!silent) toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useAutoRefresh(() => loadAll(true), 5000);

  // Polling số khách online, tự dừng khi rời trang
  useEffect(() => {
    let alive = true;
    const load = () =>
      Promise.resolve(getOnlineCustomerCount())
        .then((n: any) => { if (alive && typeof n === 'number') setOnlineCount(n); })
        .catch(() => {});
    load();
    const timer = setInterval(load, ONLINE_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  const totalCustomers = customers.length;
  const pendingFeedbacks = feedbacks.filter((f) => f.status === 'Pending').length;
  const activeSurveys = surveys.filter((s) => s.isActive).length;

  const ageCounts = AGE_BUCKETS.map((b) => ({
    ...b,
    value: customers.filter((c) => {
      const age = getAge(c.dateOfBirth);
      return age !== null && age >= b.min && age <= b.max;
    }).length,
  }));

  // Giống trang Quản lý đánh giá: mới nhất trước
  const recentFeedbacks = [...feedbacks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentSurveys = [...surveys]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const totalPreferenceVotes = preferences.reduce((sum, p) => sum + p.count, 0);
  const prefPct = (n: number) => (totalPreferenceVotes ? Math.round((n / totalPreferenceVotes) * 1000) / 10 : 0);

  if (loading) return <div className="dashboard-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="admin-dashboard">
      <h1 className="db-title">Dashboard CRM</h1>
      <p className="db-subtitle">Tổng quan khách hàng và hoạt động</p>

      <div className="stat-cards-grid">
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Khách hàng</span>
            <span className="stat-icon-box blue"><Users size={18} /></span>
          </div>
          <div className="stat-value">{totalCustomers}</div>
          <div className="stat-foot muted">Tổng khách hàng</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Đang online</span>
            <span className="stat-icon-box green"><Wifi size={18} /></span>
          </div>
          <div className="stat-value">{onlineCount ?? '—'}</div>
          <div className="stat-foot success">● Khách hàng đang hoạt động</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Phản hồi mới</span>
            <span className="stat-icon-box red"><Star size={18} /></span>
          </div>
          <div className="stat-value">{pendingFeedbacks}</div>
          <div className="stat-foot danger">● Chưa xử lý</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Khảo sát</span>
            <span className="stat-icon-box purple"><FileText size={18} /></span>
          </div>
          <div className="stat-value">{activeSurveys}</div>
          <div className="stat-foot muted">Đang hoạt động / {surveys.length} tổng</div>
        </div>
      </div>

      <div className="db-mid-grid">
        <div className="panel">
          <h3 className="panel-title">Khách hàng theo độ tuổi</h3>
          <div className="donut-row">
            <DonutChart
              size={170}
              segments={ageCounts.map((a) => ({ value: a.value, color: a.color, label: a.label }))}
              centerLabel={`${totalCustomers}`}
              centerSub="Tổng khách hàng"
            />
            <ul className="legend-list">
              {ageCounts.map((a) => (
                <li key={a.label}><span className="dot" style={{ background: a.color }} /> {a.label} <b>{totalCustomers ? Math.round((a.value / totalCustomers) * 100) : 0}%</b></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Sở thích khách hàng</h3>
          {preferences.length === 0 ? (
            <p className="empty-hint">Chưa có dữ liệu sở thích khách hàng.</p>
          ) : (
            <ul className="bar-list">
              {preferences
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map((p, i) => (
                  <li key={p.tag} className="bar-row">
                    <span className="bar-row-label" title={p.tag}>{p.tag}</span>
                    <span className="bar-row-track">
                      <span
                        className="bar-row-fill"
                        style={{ width: `${prefPct(p.count)}%`, background: REPORT_COLORS[i % REPORT_COLORS.length] }}
                      />
                    </span>
                    <span className="bar-row-value">{p.count}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-header-row">
            <h3 className="panel-title">Khảo sát mới nhất</h3>
            <span className="link-muted" onClick={() => navigate('/surveys')}>Xem tất cả</span>
          </div>
          {recentSurveys.length === 0 ? (
            <p className="empty-hint">Chưa có khảo sát nào.</p>
          ) : (
            <ul className="survey-mini-list">
              {recentSurveys.map((s) => (
                <li key={s.surveyId} onClick={() => navigate(`/surveys/${s.surveyId}`)}>
                  <span className="survey-mini-title">{s.title}</span>
                  <span className="survey-mini-count">{s._count?.surveyResponses ?? 0} phản hồi</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header-row">
          <h3 className="panel-title">Phản hồi gần đây</h3>
          <span className="link-muted" onClick={() => navigate('/feedbacks')}>Xem tất cả</span>
        </div>
        {recentFeedbacks.length === 0 ? (
          <p className="empty-hint">Chưa có phản hồi nào.</p>
        ) : (
          <table className="mini-table">
            <thead>
              <tr><th>#</th><th>Sản phẩm</th><th>Khách hàng</th><th>Tiêu đề</th><th>Rating</th><th>Ngày gửi</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {recentFeedbacks.map((f, idx) => {
                const name = fullNameOf(f.customer) || `KH #${f.customerId}`;
                return (
                  <tr key={f.feedbackId}>
                    <td style={{ color: 'var(--color-text-muted)' }}>{idx + 1}</td>
                    <td>{f.product?.productName ?? `SP #${f.productId}`}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=32`}
                          alt="" width={24} height={24} style={{ borderRadius: '50%' }}
                        />
                        <span>{name}</span>
                      </div>
                    </td>
                    <td>{f.title}</td>
                    <td><RatingStars rating={f.rating} /></td>
                    <td>{new Date(f.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td><FeedbackStatusBadge status={f.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;