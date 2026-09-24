import React from 'react';
import DonutChart from '../../components/DonutChart';

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

const CrmReportTab: React.FC<{ report: CustomerReport | null }> = ({ report }) => {
  const reportPct = (n: number) =>
    report && report.totalActiveCustomers ? Math.round((n / report.totalActiveCustomers) * 1000) / 10 : 0;

  const totalPreferenceVotes = report ? report.byPreference.reduce((s, p) => s + p.count, 0) : 0;
  const prefPct = (n: number) => (totalPreferenceVotes ? Math.round((n / totalPreferenceVotes) * 1000) / 10 : 0);

  return (
    <div className="db-mid-grid">
      <div className="panel">
        <h3 className="panel-title">Khách hàng theo độ tuổi</h3>
        {!report || report.totalActiveCustomers === 0 ? (
          <p className="empty-hint">Chưa có dữ liệu.</p>
        ) : (
          <div className="donut-row">
            <DonutChart
              size={140}
              segments={report.byAgeGroup.map((a, i) => ({ value: a.count, color: REPORT_COLORS[i % REPORT_COLORS.length], label: a.bucket }))}
              centerLabel={`${report.totalActiveCustomers}`}
              centerSub="Tổng khách hàng"
            />
            <ul className="legend-list">
              {report.byAgeGroup.map((a, i) => (
                <li key={a.bucket}>
                  <span className="dot" style={{ background: REPORT_COLORS[i % REPORT_COLORS.length] }} />
                  {a.bucket} <b>{a.count} ({reportPct(a.count)}%)</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="panel">
        <h3 className="panel-title">Khách hàng theo giới tính</h3>
        {!report || report.totalActiveCustomers === 0 ? (
          <p className="empty-hint">Chưa có dữ liệu.</p>
        ) : (
          <ul className="bar-list">
            {report.byGender.map((g, i) => (
              <li key={g.gender} className="bar-row">
                <span className="bar-row-label">{g.gender}</span>
                <span className="bar-row-track">
                  <span className="bar-row-fill" style={{ width: `${reportPct(g.count)}%`, background: REPORT_COLORS[i % REPORT_COLORS.length] }} />
                </span>
                <span className="bar-row-value">{g.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h3 className="panel-title">Sở thích khách hàng</h3>
        {!report || report.byPreference.length === 0 ? (
          <p className="empty-hint">Chưa có dữ liệu sở thích.</p>
        ) : (
          <ul className="bar-list">
            {report.byPreference
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((p, i) => (
                <li key={p.tag} className="bar-row">
                  <span className="bar-row-label" title={p.tag}>{p.tag}</span>
                  <span className="bar-row-track">
                    <span className="bar-row-fill" style={{ width: `${prefPct(p.count)}%`, background: REPORT_COLORS[i % REPORT_COLORS.length] }} />
                  </span>
                  <span className="bar-row-value">{p.count}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CrmReportTab;