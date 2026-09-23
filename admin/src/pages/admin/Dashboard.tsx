import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, UserCheck, Lock, Package, ShieldCheck, Heart } from 'lucide-react';
import { getAccounts, getProducts, getCustomerReport } from '../../services/api';
import DonutChart from '../../components/DonutChart';
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

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [report, setReport] = useState<CustomerReport | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Bỏ getRecentActivity() — backend chưa có endpoint "hoạt động gần
        // đây" nào (không route nào trong routes/ khớp) nên request cũ luôn
        // trả 404. Thay bằng getCustomerReport(), gọi đúng
        // GET /api/customers/report đã có sẵn ở customer.routes.js /
        // customerController.report, để panel "Báo cáo CRM" có dữ liệu
        // thật thay vì để trống.
        const [accs, products, rpt] = await Promise.all([
          getAccounts(),
          getProducts(),
          getCustomerReport(),
        ]);
        setAccounts(accs);
        setTotalProducts(products.length);
        setReport(rpt);
      } catch {
        toast.error('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = accounts.length;
  const active = accounts.filter((a) => !a.isLocked).length;
  const locked = accounts.filter((a) => a.isLocked).length;
  const admins = accounts.filter((a) => a.role?.roleName === 'Admin').length;
  const managers = accounts.filter((a) => a.role?.roleName === 'Manager').length;
  const customers = accounts.filter((a) => a.role?.roleName === 'Customer').length;

  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

  const reportPct = (n: number) =>
    report && report.totalActiveCustomers
      ? Math.round((n / report.totalActiveCustomers) * 1000) / 10
      : 0;

  if (loading) return <div className="dashboard-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="admin-dashboard">
      <h1 className="db-title">Dashboard Admin</h1>
      <p className="db-subtitle">Tổng quan hệ thống</p>

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
          <div className="stat-foot success">● Đang hoạt động</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Tài khoản bị khóa</span>
            <span className="stat-icon-box red"><Lock size={18} /></span>
          </div>
          <div className="stat-value">{locked}</div>
          <div className="stat-foot danger">● Đã khóa</div>
        </div>
        <div className="stat-card-v2">
          <div className="stat-card-top">
            <span className="stat-label">Sản phẩm</span>
            <span className="stat-icon-box purple"><Package size={18} /></span>
          </div>
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-foot muted">Tổng số sản phẩm</div>
        </div>
      </div>

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
          <div className="panel-header-row">
            <h3 className="panel-title">Báo cáo CRM</h3>
          </div>
          {!report ? (
            <p className="empty-hint">Chưa có dữ liệu.</p>
          ) : (
            <ul className="crm-summary-list">
              <li><ShieldCheck size={16} /> Tổng khách hàng <b>{report.totalActiveCustomers}</b></li>
              <li><Heart size={16} /> Nhóm sở thích <b>{report.byPreference.length}</b></li>
              {report.byPreference.slice(0, 4).map((p) => (
                <li key={p.tag} style={{ paddingLeft: 24, fontSize: 12.5 }}>
                  {p.tag} <b>{p.count}</b>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
