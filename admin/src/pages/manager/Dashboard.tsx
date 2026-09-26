import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Wifi, Star, FileText, X } from 'lucide-react';
import { getCustomers, getFeedbacks, getSurveys, getCustomerReport } from '../../services/api';
import DonutChart from '../../components/DonutChart';
import { useNavigate } from 'react-router-dom';
import { getOnlineCustomerCount } from '../../services/api';
import './Dashboard.css';

const AGE_BUCKETS = [
  { label: '18 - 25', min: 18, max: 25, color: '#F97316' },
  { label: '26 - 35', min: 26, max: 35, color: '#2563EB' },
  { label: '36 - 45', min: 36, max: 45, color: '#DC2626' },
  { label: '46+', min: 46, max: 999, color: '#059669' },
];

const REPORT_COLORS = ['#7C3AED', '#F59E0B', '#059669', '#2563EB', '#DC2626', '#14B8A6'];

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

  useEffect(() => {
    (async () => {
      try {
        const [custs, fbs, svs] = await Promise.all([getCustomers(), getFeedbacks(), getSurveys()]);
        setCustomers(custs);
        setFeedbacks(fbs);
        setSurveys(svs);
        getCustomerReport()
          .then((rpt: any) => setPreferences(rpt?.byPreference ?? []))
          .catch(() => setPreferences([]));
      } catch {
        toast.error('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    getOnlineCustomerCount().then(setOnlineCount);
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

  const recentFeedbacks = [...feedbacks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentSurveys = [...surveys]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const totalPreferenceVotes = preferences.reduce((sum, p) => sum + p.count, 0);
  const prefPct = (n: number) => (totalPreferenceVotes ? Math.round((n / totalPreferenceVotes) * 1000) / 10 : 0);

  // Khách hàng nào có sở thích chứa tag đang xem chi tiết (dựa vào c.preferences[].tag)
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
          <span className="link-muted">Xem tất cả</span>
        </div>
        {recentFeedbacks.length === 0 ? (
          <p className="empty-hint">Chưa có phản hồi nào.</p>
        ) : (
          <table className="mini-table">
            <thead><tr><th>Khách hàng</th><th>Sản phẩm</th><th>Nội dung</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
            <tbody>
              {recentFeedbacks.map((f) => (
                <tr key={f.feedbackId}>
                  <td>{f.customer?.fullName ?? `KH #${f.customerId}`}</td>
                  <td>{f.product?.productName ?? `SP #${f.productId}`}</td>
                  <td>{f.title}</td>
                  <td>{f.status}</td>
                  <td>{new Date(f.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: nhóm khách hàng theo sở thích */}
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
                      <tr>
                        <th>#</th>
                        <th>Họ tên</th>
                        <th>SĐT</th>
                        <th>Giới tính</th>
                      </tr>
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