import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getCustomerReport } from '../../services/api';
import CrmReportTab from './CrmReportTab';
import './Dashboard.css';

interface CustomerReport {
  totalActiveCustomers: number;
  byGender: { gender: string; count: number }[];
  byAgeGroup: { bucket: string; count: number }[];
  byPreference: { tag: string; count: number }[];
}

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CustomerReport | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const rpt = await getCustomerReport();
        setReport(rpt);
      } catch {
        toast.error('Không thể tải báo cáo CRM');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="dashboard-loading">Đang tải dữ liệu...</div>;

  return (
    <div className="admin-dashboard">
      <h1 className="db-title">Báo cáo CRM</h1>
      <p className="db-subtitle">Thống kê khách hàng: độ tuổi, giới tính, sở thích</p>
      <CrmReportTab report={report} />
    </div>
  );
};

export default ReportsPage;