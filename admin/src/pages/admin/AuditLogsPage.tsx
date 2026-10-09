import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, History } from 'lucide-react';
import api from '../../utils/api';
import Pagination from '../../components/Pagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import './AuditLogsPage.css';

interface AuditLog {
  logId: number;
  actorId: number | null;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

type Tone = 'green' | 'red' | 'amber' | 'blue' | 'purple';
const ACTIONS: Record<string, { label: string; tone: Tone }> = {
  LOCK_ACCOUNT: { label: 'Khóa tài khoản', tone: 'red' },
  UNLOCK_ACCOUNT: { label: 'Mở khóa tài khoản', tone: 'green' },
  CHANGE_ROLE: { label: 'Đổi vai trò', tone: 'amber' },
  CREATE_STAFF: { label: 'Tạo tài khoản nội bộ', tone: 'green' },
  CREATE_CUSTOMER: { label: 'Thêm khách hàng', tone: 'green' },
  DELETE_CUSTOMER: { label: 'Xóa khách hàng', tone: 'red' },
  APPROVE_FEEDBACK: { label: 'Duyệt đánh giá', tone: 'green' },
  REJECT_FEEDBACK: { label: 'Từ chối đánh giá', tone: 'red' },
  DELETE_FEEDBACK: { label: 'Xóa đánh giá', tone: 'red' },
  REPLY_FEEDBACK: { label: 'Trả lời đánh giá', tone: 'blue' },
  UPDATE_REPLY: { label: 'Sửa phản hồi', tone: 'blue' },
  DELETE_REPLY: { label: 'Xóa phản hồi', tone: 'red' },
  CREATE_SURVEY: { label: 'Tạo khảo sát', tone: 'purple' },
  TOGGLE_SURVEY: { label: 'Đóng/mở khảo sát', tone: 'amber' },
  ASSIGN_SURVEY: { label: 'Gửi khảo sát', tone: 'purple' },
  CREATE_PRODUCT: { label: 'Thêm sản phẩm', tone: 'green' },
  UPDATE_PRODUCT: { label: 'Sửa sản phẩm', tone: 'blue' },
  TOGGLE_PRODUCT: { label: 'Ẩn/hiện sản phẩm', tone: 'amber' },
  CREATE_CATEGORY: { label: 'Thêm danh mục', tone: 'green' },
  UPDATE_CATEGORY: { label: 'Sửa danh mục', tone: 'blue' },
  DELETE_CATEGORY: { label: 'Xóa danh mục', tone: 'red' },
  CREATE_SUPPLIER: { label: 'Thêm nhà cung cấp', tone: 'green' },
  UPDATE_SUPPLIER: { label: 'Sửa nhà cung cấp', tone: 'blue' },
  DELETE_SUPPLIER: { label: 'Xóa nhà cung cấp', tone: 'red' },
  CREATE_BANNER: { label: 'Thêm banner', tone: 'green' },
  UPDATE_BANNER: { label: 'Sửa banner', tone: 'blue' },
  TOGGLE_BANNER: { label: 'Bật/ẩn banner', tone: 'amber' },
  DELETE_BANNER: { label: 'Xóa banner', tone: 'red' },
};

const ENTITIES: Record<string, string> = {
  Account: 'Tài khoản', Customer: 'Khách hàng', Feedback: 'Đánh giá', ReviewReply: 'Phản hồi',
  Survey: 'Khảo sát', Product: 'Sản phẩm', Category: 'Danh mục',
  Supplier: 'Nhà cung cấp', Banner: 'Banner',
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN')}`;
};

const EMPTY = { keyword: '', actorRole: '', action: '', entityType: '', from: '', to: '' };

const AuditLogsPage: React.FC = () => {
  const [draft, setDraft] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    try {
      const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
      (Object.keys(filters) as (keyof typeof EMPTY)[]).forEach((k) => { if (filters[k]) params[k] = filters[k]; });
      const res = await api.get('/audit-logs', { params });
      const body = res.data?.data ?? res.data;
      setItems(body.items ?? []);
      setTotal(body.total ?? 0);
    } catch (e: any) {
      if (!silent) toast.error(e?.response?.data?.message ?? 'Không tải được nhật ký hoạt động');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useAutoRefresh(() => load(true), 5000);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(draft);
    setPage(1);
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="al-page">
      <div className="al-head">
        <h1 className="al-title"><History size={22} /> Nhật ký hoạt động</h1>
        <p className="al-sub">Lịch sử thao tác của Admin và Manager: ai đã làm gì, vào lúc nào.</p>
      </div>

      <form className="al-toolbar" onSubmit={apply}>
        <label className="al-search">
          <Search size={16} />
          <input placeholder="Tìm theo người thực hiện hoặc nội dung..." value={draft.keyword} onChange={set('keyword')} />
        </label>
        <select className="al-select" value={draft.actorRole} onChange={set('actorRole')}>
          <option value="">Mọi vai trò</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
        </select>
        <select className="al-select" value={draft.action} onChange={set('action')}>
          <option value="">Mọi hành động</option>
          {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="al-select" value={draft.entityType} onChange={set('entityType')}>
          <option value="">Mọi đối tượng</option>
          {Object.entries(ENTITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input className="al-select" type="date" value={draft.from} onChange={set('from')} title="Từ ngày" />
        <input className="al-select" type="date" value={draft.to} onChange={set('to')} title="Đến ngày" />
        <button type="submit" className="al-btn"><Search size={15} /> Tìm kiếm</button>
      </form>

      <div className="al-card">
        <div className="al-table-wrap">
          <table className="al-table">
            <thead>
              <tr>
                <th>#</th><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Nội dung</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="al-empty">Đang tải...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="al-empty">Chưa có hoạt động nào</td></tr>
              ) : items.map((l, i) => {
                const a = ACTIONS[l.action] ?? { label: l.action, tone: 'blue' as Tone };
                return (
                  <tr key={l.logId}>
                    <td className="al-muted">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="al-nowrap">{fmtTime(l.createdAt)}</td>
                    <td>
                      <div className="al-actor">{l.actorName}</div>
                      <span className={`al-role ${l.actorRole === 'Admin' ? 'admin' : 'manager'}`}>{l.actorRole}</span>
                    </td>
                    <td><span className={`al-tag ${a.tone}`}>{a.label}</span></td>
                    <td className="al-nowrap">
                      {ENTITIES[l.entityType] ?? l.entityType}
                      {l.entityId != null && <span className="al-muted"> #{l.entityId}</span>}
                    </td>
                    <td>{l.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={PAGE_SIZE} itemLabel="hoạt động" onPageChange={setPage} />
      </div>
    </div>
  );
};

export default AuditLogsPage;