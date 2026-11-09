import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, UserCheck, Lock, ShieldCheck, Heart, Trash2 } from 'lucide-react';
import { getAccounts, getCustomerReport } from '../../services/api';
import DonutChart from '../../components/DonutChart';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { fullNameOf } from '../../utils/name';
import './Dashboard.css';

interface GenderRow { gender: string; count: number; }
interface AgeRow { bucket: string; count: number; }
interface PreferenceRow { tag: string; count: number; }

interface CustomerReport {
  totalActiveCustomers: number;
  byGender: GenderRow[];
  byAgeGroup: AgeRow[];
  byPreference: PreferenceRow[];
}

const REPORT_COLORS = ['#7C3AED', '#F59E0B', '#059669', '#2563EB', '#DC2626', '#14B8A6'];
const ROLE_LABELS: Record<string, string> = { Admin: 'Admin', Manager: 'Manager', Customer: 'Khách hàng' };
const ROLE_CLASS: Record<string, string> = { Admin: 'db-role-admin', Manager: 'db-role-manager', Customer: 'db-role-customer' };

/** Tài khoản đã bị xóa mềm = hồ sơ (customer/employee) có isDeleted = true */
const isDeletedAccount = (a: any) => !!(a.employee ?? a.customer)?.isDeleted;
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [report, setReport] = useState<CustomerReport | null>(null);

  /** silent = true: dùng cho auto-refresh, không bật spinner, không báo lỗi. */
  const load = useCallback(async (silent = false) => {
    try {
      const [accs, rpt] = await Promise.all([
        getAccounts(),
        getCustomerReport(),
      ]);
      setAccounts(accs ?? []);
      setReport(rpt);
    } catch {
      if (!silent) toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time: tự cập nhật mỗi 5 giây
  useAutoRefresh(() => load(true), 5000);

  // Tách riêng: tài khoản còn tồn tại (chưa xóa) và tài khoản đã xóa
  const live = useMemo(() => accounts.filter((a) => !isDeletedAccount(a)), [accounts]);
  const deleted = accounts.length - live.length;

  const total = live.length;
  const active = live.filter((a) => !a.isLocked).length;
  const locked = live.filter((a) => a.isLocked).length;
  const admins = live.filter((a) => a.role?.roleName === 'Admin').length;
  const managers = live.filter((a) => a.role?.roleName === 'Manager').length;
  const customers = live.filter((a) => a.role?.roleName === 'Customer').length;

  const recent = useMemo(
    () =>
      [...live]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [live],
  );

  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

  const reportPct = (n: number) =>
    report && report.totalActiveCustomers
      ? Math.round((n / report.totalActiveCustomers) * 1000) / 10
      : 0;

  if (loading) return <div className="dashboard-loading">Đang tải dữ liệu...</div>;

  const statusLegend = [
    { label: 'Đang hoạt động', value: active, color: '#059669' },
    { label: 'Bị khóa', value: locked, color: '#F59E0B' },
    { label: 'Đã xóa', value: deleted, color: '#9CA3AF' },
  ];
  const statusTotal = active + locked + deleted;
  const statusPct = (n: number) => (statusTotal ? Math.round((n / statusTotal) * 1000) / 10 : 0);

  return (
    <div className="admin-dashboard">
      <h1 className="db-title">Dashboard Admin</h1>
      <p className="db-subtitle">Tổng quan hệ thống</p>

      {/* ===== Hàng 1: 4 thẻ thống kê ===== */}
      <div className="stat-cards-grid">
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Tổng tài khoản</span>
            <span className="stat-icon-box blue"><Users size={18} /></span>
          </div>
          <div className="stat-value">{total}</div>
          <div className="stat-foot muted">Admin: {admins} · Manager: {managers} · Khách hàng: {customers}</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Tài khoản đang hoạt động</span>
            <span className="stat-icon-box green"><UserCheck size={18} /></span>
          </div>
          <div className="stat-value">{active}</div>
          <div className="stat-foot success">● {pct(active)}% tổng tài khoản</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Tài khoản bị khóa</span>
            <span className="stat-icon-box red"><Lock size={18} /></span>
          </div>
          <div className="stat-value">{locked}</div>
          <div className="stat-foot danger">● {pct(locked)}% tổng tài khoản</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Tài khoản đã xóa</span>
            <span className="stat-icon-box gray"><Trash2 size={18} /></span>
          </div>
          <div className="stat-value">{deleted}</div>
          <div className="stat-foot muted">● Nằm trong mục Lưu trữ</div>
        </div>
      </div>

      {/* ===== Hàng 2: 3 biểu đồ ===== */}
      <div className="db-mid-grid">
        <div className="panel">
          <h3 className="panel-title">Thống kê tài khoản theo vai trò</h3>
          <div className="donut-row">
            <DonutChart
              size={140}
              segments={[
                { value: admins, color: '#7C3AED', label: 'Admin' },
                { value: managers, color: '#F59E0B', label: 'Manager' },
                { value: customers, color: '#059669', label: 'Khách hàng' },
              ]}
              centerLabel={`${total}`}
              centerSub="Tổng tài khoản"
            />
            <ul className="legend-list">
              <li><span className="dot" style={{ background: '#7C3AED' }} /> Admin <b>{admins} ({pct(admins)}%)</b></li>
              <li><span className="dot" style={{ background: '#F59E0B' }} /> Manager <b>{managers} ({pct(managers)}%)</b></li>
              <li><span className="dot" style={{ background: '#059669' }} /> Khách hàng <b>{customers} ({pct(customers)}%)</b></li>
            </ul>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Thống kê tài khoản theo trạng thái</h3>
          <div className="donut-row">
            <DonutChart
              size={140}
              segments={statusLegend.map((s) => ({ value: s.value, color: s.color, label: s.label }))}
              centerLabel={`${statusTotal}`}
              centerSub="Tất cả tài khoản"
            />
            <ul className="legend-list">
              {statusLegend.map((s) => (
                <li key={s.label}>
                  <span className="dot" style={{ background: s.color }} /> {s.label}
                  <b>{s.value} ({statusPct(s.value)}%)</b>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header-row">
            <h3 className="panel-title" style={{ marginBottom: 0 }}>Báo cáo CRM</h3>
          </div>
          {!report ? (
            <p className="empty-hint">Chưa có dữ liệu.</p>
          ) : (
            <>
              <ul className="crm-summary-list">
                <li><ShieldCheck size={16} /> Tổng khách hàng <b>{report.totalActiveCustomers}</b></li>
                <li><Heart size={16} /> Nhóm sở thích <b>{report.byPreference.length}</b></li>
              </ul>
              {report.byPreference.length > 0 && (
                <ul className="bar-list" style={{ marginTop: 14 }}>
                  {report.byPreference.slice(0, 5).map((p, i) => (
                    <li key={p.tag} className="bar-row bar-row--wide">
                      <span className="bar-row-label" title={p.tag}>{p.tag}</span>
                      <span className="bar-row-track">
                        <span
                          className="bar-row-fill"
                          style={{ width: `${reportPct(p.count)}%`, background: REPORT_COLORS[i % REPORT_COLORS.length] }}
                        />
                      </span>
                      <span className="bar-row-value">{p.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== Hàng 3: khách hàng + tài khoản mới ===== */}
      <div className="db-bottom-grid">
        <div className="panel">
          <h3 className="panel-title">Khách hàng theo giới tính / độ tuổi</h3>
          {!report || report.totalActiveCustomers === 0 ? (
            <p className="empty-hint">Chưa có dữ liệu khách hàng để thống kê.</p>
          ) : (
            <div className="report-cols">
              <div>
                <p className="report-col-title">Giới tính</p>
                <ul className="bar-list">
                  {report.byGender.map((g, i) => (
                    <li key={g.gender} className="bar-row">
                      <span className="bar-row-label">{g.gender}</span>
                      <span className="bar-row-track">
                        <span
                          className="bar-row-fill"
                          style={{ width: `${reportPct(g.count)}%`, background: REPORT_COLORS[i % REPORT_COLORS.length] }}
                        />
                      </span>
                      <span className="bar-row-value">{g.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="report-col-title">Độ tuổi</p>
                <ul className="bar-list">
                  {report.byAgeGroup.map((a, i) => (
                    <li key={a.bucket} className="bar-row">
                      <span className="bar-row-label">{a.bucket}</span>
                      <span className="bar-row-track">
                        <span
                          className="bar-row-fill"
                          style={{ width: `${reportPct(a.count)}%`, background: REPORT_COLORS[i % REPORT_COLORS.length] }}
                        />
                      </span>
                      <span className="bar-row-value">{a.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title">Tài khoản mới nhất</h3>
          {recent.length === 0 ? (
            <p className="empty-hint">Chưa có tài khoản nào.</p>
          ) : (
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => {
                  const roleName = a.role?.roleName ?? '';
                  const name = fullNameOf(a.employee ?? a.customer ?? null) || a.username;
                  return (
                    <tr key={a.accountId}>
                      <td className="mini-name" title={name}>{name}</td>
                      <td>
                        <span className={`db-role ${ROLE_CLASS[roleName] ?? 'db-role-customer'}`}>
                          {ROLE_LABELS[roleName] ?? roleName}
                        </span>
                      </td>
                      <td>{fmtDate(a.createdAt)}</td>
                      <td>
                        <span className={`db-status ${a.isLocked ? 'db-status-locked' : 'db-status-active'}`}>
                          {a.isLocked ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
