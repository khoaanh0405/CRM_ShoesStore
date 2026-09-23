import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, X } from 'lucide-react';
import api from '../../utils/api';
import Pagination from '../../components/Pagination';
import './CustomersPage.css';

interface Customer {
  customerId: number;
  fullName: string;
  phone?: string;
  gender?: string;
  isLocked: boolean;
  preferences?: { tag: string }[];
  account: { username: string; isLocked: boolean };
}

const ITEMS_PER_PAGE = 10;

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { search, page, limit: ITEMS_PER_PAGE } });
      const data = res.data?.data ?? res.data ?? [];
      setCustomers(data);
      setTotal(res.data?.total ?? data.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, page]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post('/admin/customers', form);
      toast.success('✅ Đã thêm khách hàng');
      setShowAdd(false);
      setForm({ username: '', password: '', fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Thêm thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async (c: Customer) => {
    await api.patch(`/accounts/${c.account.username}/${c.isLocked ? 'unlock' : 'lock'}`);
    toast.success(c.isLocked ? '🔓 Đã mở khóa' : '🔒 Đã khóa tài khoản');
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa (mềm) khách hàng này?')) return;
    await api.delete(`/customers/${id}`);
    toast.success('Đã xóa khách hàng');
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý khách hàng</h1>
          <p className="page-subtitle">Thêm, khóa/mở khóa và xóa khách hàng</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Thêm khách hàng
        </button>
      </div>

      <div className="search-box-enhanced">
        <Search size={16} className="search-icon" />
        <input
          className="search-input"
          placeholder="Tìm theo tên/SĐT..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button className="search-clear-btn" onClick={() => setSearch('')}><X size={14} /></button>
        )}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      ) : customers.length === 0 ? (
        <div className="empty-state"><p>Không có khách hàng nào</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr><th>Họ tên</th><th>SĐT</th><th>Giới tính</th><th>Sở thích</th><th>Trạng thái</th><th className="col-actions">Thao tác</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customerId}>
                  <td className="font-medium">{c.fullName}</td>
                  <td>{c.phone}</td>
                  <td>{c.gender}</td>
                  <td>
                    {(c.preferences ?? []).length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="pref-badges">
                        {c.preferences!.slice(0, 2).map((p) => (
                          <span key={p.tag} className="pref-badge">{p.tag}</span>
                        ))}
                        {c.preferences!.length > 2 && <span className="pref-badge more">+{c.preferences!.length - 2}</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${c.isLocked ? 'badge-rejected' : 'badge-approved'}`}>
                      {c.isLocked ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-group">
                      <button className="action-btn toggle-off-btn" onClick={() => handleLock(c)}>
                        {c.isLocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(c.customerId)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="khách hàng"
        onPageChange={setPage}
      />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm khách hàng mới</h3>
              <button className="modal-close-btn" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <div className="modal-body modal-grid-2">
              <div className="form-group"><label className="form-label">Username</label><input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Mật khẩu</label><input type="password" className="form-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div className="form-group full-width"><label className="form-label">Họ tên</label><input className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Ngày sinh</label><input type="date" className="form-input" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Giới tính</label><input className="form-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">SĐT</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="form-group full-width"><label className="form-label">Địa chỉ</label><input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;