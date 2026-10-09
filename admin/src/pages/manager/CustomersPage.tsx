import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, X } from 'lucide-react';
import api from '../../utils/api';
import Pagination from '../../components/Pagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { showConfirm } from '../../lib/dialog';
import { normalizeEmail, validateEmail, validateNewPassword, PASSWORD_HINT } from '../../utils/validation';
import './CustomersPage.css';

interface Customer {
  customerId: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  isLocked: boolean;
  preferences?: { tag: string }[];
}

const ITEMS_PER_PAGE = 10;
const PREFERENCE_OPTIONS = ['Giày Sneaker', 'Giày Chạy Bộ', 'Giày Bóng Rổ', 'Giày Thể Thao', 'Giày Cao Gót', 'Giày Sandal', 'Giày Da'];

type StatusFilter = 'ALL' | 'ACTIVE' | 'LOCKED';
type GenderFilter = 'ALL' | 'Nam' | 'Nữ' | 'Khác';
type SortBy = 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC';

const EMPTY_FORM = { username: '', email: '', password: '', fullName: '', dateOfBirth: '', gender: '', phone: '', address: '' };

const NotUpdated = () => <span className="text-muted">Chưa cập nhật</span>;

const CustomersPage = () => {
  const [all, setAll] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [searchDraft, setSearchDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<StatusFilter>('ALL');
  const [genderDraft, setGenderDraft] = useState<GenderFilter>('ALL');
  const [prefDraft, setPrefDraft] = useState('ALL');
  const [filters, setFilters] = useState({ search: '', status: 'ALL' as StatusFilter, gender: 'ALL' as GenderFilter, pref: 'ALL' });
  const [sortBy, setSortBy] = useState<SortBy>('NEWEST');

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchDraft, status: statusDraft, gender: genderDraft, pref: prefDraft });
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setFilters((f) => ({ ...f, search: '' }));
    setPage(1);
  };

  /** silent = true: dùng cho auto-refresh, không bật spinner, không báo lỗi. */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/customers');
      setAll(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      if (!silent) toast.error(e.response?.data?.message ?? 'Không tải được khách hàng');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true), 5000);

  const filtered = useMemo(() => {
    const k = filters.search.trim().toLowerCase();
    return all
      .filter((c) => {
        const matchSearch =
          !k ||
          c.fullName.toLowerCase().includes(k) ||
          (c.phone ?? '').includes(k) ||
          (c.email ?? '').toLowerCase().includes(k);
        const matchStatus = filters.status === 'ALL' || (filters.status === 'LOCKED') === c.isLocked;
        const matchGender = filters.gender === 'ALL' || c.gender === filters.gender;
        const matchPref = filters.pref === 'ALL' || (c.preferences ?? []).some((p) => p.tag === filters.pref);
        return matchSearch && matchStatus && matchGender && matchPref;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'OLDEST': return a.customerId - b.customerId;
          case 'NAME_ASC': return a.fullName.localeCompare(b.fullName, 'vi');
          case 'NAME_DESC': return b.fullName.localeCompare(a.fullName, 'vi');
          default: return b.customerId - a.customerId;
        }
      });
  }, [all, filters, sortBy]);

  const total = filtered.length;
  const customers = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const handleAdd = async () => {
    if (!form.username.trim() || !form.fullName.trim() || !form.dateOfBirth) {
      toast.error('Vui lòng nhập đầy đủ Username, họ tên và ngày sinh.');
      return;
    }
    const emailErr = validateEmail(form.email);
    if (emailErr) return void toast.error(emailErr);
    const pwErr = validateNewPassword(form.password, form.username);
    if (pwErr) return void toast.error(pwErr);

    setSaving(true);
    try {
      await api.post('/admin/customers', {
        ...form,
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: normalizeEmail(form.email),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      toast.success('✅ Đã thêm khách hàng');
      setShowAdd(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Thêm thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleLock = async (c: Customer) => {
    setActionLoadingId(c.customerId);
    try {
      await api.patch(`/accounts/${c.customerId}/${c.isLocked ? 'unlock' : 'lock'}`);
      toast.success(c.isLocked ? '🔓 Đã mở khóa' : '🔒 Đã khóa tài khoản');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Thao tác thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (c: Customer) => {
    const ok = await showConfirm({
      title: 'Xóa khách hàng?',
      message: `"${c.fullName}" sẽ bị xóa (xóa mềm, vẫn giữ lịch sử).`,
      confirmLabel: 'Xóa', tone: 'warning', danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/customers/${c.customerId}`);
      toast.success('Đã xóa khách hàng');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Xóa thất bại');
    }
  };

  const setF = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

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

      <form className="customer-search-toolbar" style={{ flexWrap: 'wrap' }} onSubmit={handleApplySearch}>
        <label className="customer-search">
          <Search size={16} className="customer-search__icon" />
          <input
            type="text"
            className="customer-search__input"
            placeholder="Tìm kiếm tên, email hoặc SĐT..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
          {searchDraft && (
            <button type="button" className="customer-search__reset" onClick={handleClearSearch} title="Xóa từ khóa">
              <X size={13} />
            </button>
          )}
        </label>

        <select className="customer-select" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value as StatusFilter)}>
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="LOCKED">Đã khóa</option>
        </select>

        <select className="customer-select" value={genderDraft} onChange={(e) => setGenderDraft(e.target.value as GenderFilter)}>
          <option value="ALL">Tất cả giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>

        <select className="customer-select" value={prefDraft} onChange={(e) => setPrefDraft(e.target.value)}>
          <option value="ALL">Tất cả sở thích</option>
          {PREFERENCE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select className="customer-select" value={sortBy} onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}>
          <option value="NEWEST">Mới đăng ký nhất</option>
          <option value="OLDEST">Cũ nhất</option>
          <option value="NAME_ASC">Tên A → Z</option>
          <option value="NAME_DESC">Tên Z → A</option>
        </select>

        <button type="submit" className="customer-search__submit">
          <Search size={16} /> Tìm kiếm
        </button>
      </form>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      ) : customers.length === 0 ? (
        <div className="empty-state"><p>Không có khách hàng nào</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Giới tính</th>
                <th>Địa chỉ</th>
                <th>Sở thích</th>
                <th>Trạng thái</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const prefs = c.preferences ?? [];
                return (
                  <tr key={c.customerId}>
                    <td className="font-medium">{c.fullName}</td>
                    <td>{c.email || <span className="text-muted">—</span>}</td>
                    <td>{c.phone?.trim() ? c.phone : <NotUpdated />}</td>
                    <td>{c.gender || '—'}</td>
                    <td style={{ maxWidth: 220 }}>
                      {c.address?.trim()
                        ? <span title={c.address} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</span>
                        : <NotUpdated />}
                    </td>
                    <td>
                      {prefs.length === 0 ? <NotUpdated /> : (
                        <div className="pref-badges">
                          {prefs.slice(0, 2).map((p, idx) => (
                            <span key={`${c.customerId}-${p.tag}-${idx}`} className="pref-badge">{p.tag}</span>
                          ))}
                          {prefs.length > 2 && <span className="pref-badge more">+{prefs.length - 2}</span>}
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
                        <button className="action-btn toggle-off-btn" onClick={() => handleLock(c)} disabled={actionLoadingId === c.customerId}>
                          {c.isLocked ? 'Mở khóa' : 'Khóa'}
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(c)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} itemLabel="khách hàng" onPageChange={setPage} />

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm khách hàng mới</h3>
              <button className="modal-close-btn" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>

            <div className="modal-body modal-grid-2">
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-input" value={form.username} onChange={setF('username')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" maxLength={100} placeholder="ten@gmail.com" value={form.email} onChange={setF('email')} />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Mật khẩu khởi tạo *</label>
                <input type="password" className="form-input" maxLength={50} value={form.password} onChange={setF('password')} />
                <span className="text-muted" style={{ fontSize: 12 }}>{PASSWORD_HINT}</span>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Họ tên *</label>
                <input className="form-input" value={form.fullName} onChange={setF('fullName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày sinh *</label>
                <input type="date" className="form-input" value={form.dateOfBirth} onChange={setF('dateOfBirth')} />
              </div>
              <div className="form-group">
                <label className="form-label">Giới tính</label>
                <select className="form-input" value={form.gender} onChange={setF('gender')}>
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">SĐT</label>
                <input className="form-input" value={form.phone} onChange={setF('phone')} />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input className="form-input" value={form.address} onChange={setF('address')} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;