import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Wifi, Star, FileText, X } from 'lucide-react';
import { getCustomers, getFeedbacks, getSurveys, getCustomerReport, getOnlineCustomerCount } from '../../services/api';
import DonutChart from '../../components/DonutChart';
import { RatingStars, FeedbackStatusBadge } from '../../components/FeedbackBits';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AGE_BUCKETS = [
  { label: '18 - 25', min: 18, max: 25, color: '#F97316' },
  { label: '26 - 35', min: 26, max: 35, color: '#2563EB' },
  { label: '36 - 45', min: 36, max: 45, color: '#DC2626' },
  { label: '46+', min: 46, max: 999, color: '#059669' },
];

const REPORT_COLORS = ['#7C3AED', '#F59E0B', '#059669', '#2563EB', '#DC2626', '#14B8A6'];

// Làm mới số khách hàng online mỗi 5 giây (real-time)
const ONLINE_POLL_MS = 5000;

const getAge = (dob?: string) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<{ tag: string; count: number }[]>([]);
  const [detailTag, setDetailTag] = useState<string | null>(null);
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
    .slice(0, 5);

  const totalPreferenceVotes = preferences.reduce((sum, p) => sum + p.count, 0);
  const prefPct = (n: number) => (totalPreferenceVotes ? Math.round((n / totalPreferenceVotes) * 1000) / 10 : 0);

  const customersWithTag = (tag: string) =>
    customers.filter((c) => (c.preferences ?? []).some((p: any) => (p.tag ?? p) === tag));

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
              size={140}
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
          <div className="panel-header-row">
            <h3 className="panel-title">Sở thích khách hàng</h3>
            {preferences.length > 0 && <span className="link-muted" onClick={() => setDetailTag(preferences[0].tag)}>Chi tiết</span>}
          </div>
          {preferences.length === 0 ? (
            <p className="empty-hint">Chưa có dữ liệu sở thích khách hàng.</p>
          ) : (
            <ul className="bar-list">
              {preferences
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map((p, i) => (
                  <li key={p.tag} className="bar-row clickable" onClick={() => setDetailTag(p.tag)}>
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
                const name = f.customer?.fullName ?? `KH #${f.customerId}`;
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

      {detailTag && (
        <div className="modal-overlay" onClick={() => setDetailTag(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Khách hàng thích "{detailTag}"</h3>
              <button className="modal-close-btn" onClick={() => setDetailTag(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="pref-tag-tabs">
                {preferences.map((p) => (
                  <button
                    key={p.tag}
                    className={`pref-tag-tab ${p.tag === detailTag ? 'active' : ''}`}
                    onClick={() => setDetailTag(p.tag)}
                  >
                    {p.tag} ({p.count})
                  </button>
                ))}
              </div>
              {customersWithTag(detailTag).length === 0 ? (
                <p className="empty-hint">Chưa có khách hàng nào ghi nhận sở thích này.</p>
              ) : (
                <div className="pref-table-wrapper">
                  <table className="pref-customer-table">
                    <thead>
                      <tr><th>#</th><th>Họ tên</th><th>SĐT</th><th>Giới tính</th></tr>
                    </thead>
                    <tbody>
                      {customersWithTag(detailTag).map((c, i) => (
                        <tr key={c.customerId}>
                          <td className="col-index">{i + 1}</td>
                          <td className="font-medium">{c.fullName}</td>
                          <td>{c.phone ?? '—'}</td>
                          <td>{c.gender ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;