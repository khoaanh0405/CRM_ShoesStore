import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, X, Phone, Mail, Cake, MapPin, Lock, Unlock, Trash2, UserRound } from 'lucide-react';
import api from '../../utils/api';
import { getFeedbacks } from '../../services/api';
import type { Feedback } from '../../types/feedback';
import Pagination from '../../components/Pagination';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { showConfirm } from '../../lib/dialog';
import { normalizeEmail, validateEmail, validateNewPassword, PASSWORD_HINT } from '../../utils/validation';
import { compareByName, fullNameOf } from '../../utils/name';
import { getAge } from '../../utils/customerStats';
import { PROVINCES, EMPTY_ADDRESS, composeAddress, validateAddressParts, type AddressParts } from '../../constants/vnAddress';
import './CustomersPage.css';

interface Customer {
  customerId: number;
  firstName: string; // Tên
  lastName: string;  // Họ (kèm tên đệm)
  username?: string | null;
  dateOfBirth?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  isLocked: boolean;
  // API có thể trả về số lượng khảo sát hoặc danh sách phản hồi khảo sát.
  surveyCount?: number;
  surveyResponseCount?: number;
  surveyResponses?: unknown[];
  preferences?: { categoryId: number; categoryName: string }[];
}

const ITEMS_PER_PAGE = 10;

type StatusFilter = 'ALL' | 'ACTIVE' | 'LOCKED';
type GenderFilter = 'ALL' | 'Nam' | 'Nữ' | 'Khác';
type SortBy = 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC';

const EMPTY_FORM = { username: '', email: '', password: '', lastName: '', firstName: '', dateOfBirth: '', gender: '', phone: '', address: '' };

/** Ngày hôm nay (yyyy-mm-dd) — ngày sinh không được vượt quá mốc này. */
const todayISO = () => new Date().toISOString().slice(0, 10);
const MIN_DOB = '1900-01-01';

const NotUpdated = () => <span className="text-muted not-updated">Chưa cập nhật</span>;
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;

const CustomersPage = () => {
  const [all, setAll] = useState<Customer[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addr, setAddr] = useState<AddressParts>({ ...EMPTY_ADDRESS });
  const wardOptions = useMemo(() => PROVINCES.find((p) => p.name === addr.province)?.wards ?? [], [addr.province]);
  const closeAdd = () => { setShowAdd(false); setAddr({ ...EMPTY_ADDRESS }); };

  const [searchDraft, setSearchDraft] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'ALL' as StatusFilter, gender: 'ALL' as GenderFilter, pref: 'ALL' });
  const [sortBy, setSortBy] = useState<SortBy>('NEWEST');

  /** Từ khóa: chỉ áp dụng khi bấm "Tìm kiếm" / Enter. Các ô lọc bên dưới áp dụng ngay. */
  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchDraft }));
    setPage(1);
  };
  const setFilter = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters((f) => ({ ...f, [key]: value }));
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
    // Đánh giá của khách hàng (hiển thị ở form phụ) — lỗi thì bỏ qua
    try {
      const fbs = await getFeedbacks();
      setAllFeedbacks(fbs ?? []);
    } catch { /* bỏ qua */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sở thích = danh mục: lấy danh sách lọc từ API danh mục thay vì hard-code.
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  useEffect(() => {
    api.get('/categories')
      .then((r) => {
        const rows = r.data?.data ?? r.data ?? [];
        setCategoryOptions(rows.map((c: { categoryName: string }) => c.categoryName));
      })
      .catch(() => setCategoryOptions([]));
  }, []);
  useAutoRefresh(() => load(true), 5000);

  const filtered = useMemo(() => {
    const k = filters.search.trim().toLowerCase();
    return all
      .filter((c) => {
        const matchSearch =
          !k ||
          fullNameOf(c).toLowerCase().includes(k) ||
          (c.phone ?? '').includes(k) ||
          (c.email ?? '').toLowerCase().includes(k);
        const matchStatus = filters.status === 'ALL' || (filters.status === 'LOCKED') === c.isLocked;
        const matchGender = filters.gender === 'ALL' || c.gender === filters.gender;
        const matchPref = filters.pref === 'ALL' || (c.preferences ?? []).some((p) => p.categoryName === filters.pref);
        return matchSearch && matchStatus && matchGender && matchPref;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'OLDEST': return a.customerId - b.customerId;
          case 'NAME_ASC': return compareByName(a, b);
          case 'NAME_DESC': return compareByName(b, a);
          default: return b.customerId - a.customerId;
        }
      });
  }, [all, filters, sortBy]);

  const total = filtered.length;
  const customers = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  // Form phụ luôn có một khách hàng được chọn (mặc định: dòng đầu tiên của kết quả lọc)
  useEffect(() => {
    if (loading) return;
    if (!filtered.some((c) => c.customerId === selectedId)) {
      setSelectedId(filtered[0]?.customerId ?? null);
    }
  }, [filtered, selectedId, loading]);

  const selected = useMemo(() => all.find((c) => c.customerId === selectedId) ?? null, [all, selectedId]);

  const selectedFeedbacks = useMemo(
    () => (selected ? allFeedbacks.filter((f) => f.customerId === selected.customerId) : []),
    [allFeedbacks, selected],
  );
  const avgRating = selectedFeedbacks.length
    ? selectedFeedbacks.reduce((s, f) => s + f.rating, 0) / selectedFeedbacks.length
    : 0;

  const handleAdd = async () => {
    if (!form.username.trim() || !form.lastName.trim() || !form.firstName.trim() || !form.dateOfBirth) {
      toast.error('Vui lòng nhập đầy đủ Username, họ, tên và ngày sinh.');
      return;
    }
    if (form.dateOfBirth < MIN_DOB || form.dateOfBirth > todayISO()) {
      toast.error('Ngày sinh không hợp lệ (chỉ được chọn đến hết ngày hôm nay).');
      return;
    }
    const emailErr = validateEmail(form.email);
    if (emailErr) return void toast.error(emailErr);
    const pwErr = validateNewPassword(form.password, form.username);
    if (pwErr) return void toast.error(pwErr);

    const hasAnyAddr = !!(addr.street.trim() || addr.province || addr.ward);
    if (hasAnyAddr) {
      const errs = validateAddressParts(addr);
      const firstErr = errs.street || errs.province || errs.ward;
      if (firstErr) return void toast.error(firstErr);
    }

    setSaving(true);
    try {
      await api.post('/admin/customers', {
        ...form,
        username: form.username.trim(),
        lastName: form.lastName.trim().replace(/\s+/g, ' '),
        firstName: form.firstName.trim().replace(/\s+/g, ' '),
        email: normalizeEmail(form.email),
        phone: form.phone.trim(),
        address: hasAnyAddr ? composeAddress(addr) : '',
      });
      toast.success('✅ Đã thêm khách hàng');
      closeAdd();
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
      message: `"${fullNameOf(c)}" sẽ bị xóa (xóa mềm, vẫn giữ lịch sử).`,
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

  /** ===== Form phụ: chi tiết khách hàng ===== */
  const renderDetail = () => {
    if (!selected) {
      return (
        <div className="cm-detail-empty">
          <UserRound size={44} strokeWidth={1} />
          <p>Chọn một khách hàng để xem chi tiết</p>
        </div>
      );
    }
    const c = selected;
    const name = fullNameOf(c)?.trim() || c.username || 'Khách hàng';
    const age = getAge(c.dateOfBirth);
    const prefs = c.preferences ?? [];
    const sub = [c.gender?.trim() || null, age !== null && age >= 0 ? `${age} tuổi` : null].filter(Boolean).join(' · ');

    return (
      <>
        <div className="cm-detail-head">
          <div className="cm-detail-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="cm-detail-head__info">
            <div className="cm-detail-name">{name}</div>
            <div className="cm-detail-sub">
              {sub && <span>{sub}</span>}
              <span className={`status-badge ${c.isLocked ? 'badge-rejected' : 'badge-approved'}`}>
                {c.isLocked ? 'Đã khóa' : 'Hoạt động'}
              </span>
            </div>
          </div>
        </div>

        <div className="cm-detail-body">
          <ul className="cm-contact">
            <li className="cm-customer-code"><UserRound size={15} /><span>Mã khách hàng: {c.customerId}</span></li>
            <li><Phone size={15} /><span>{c.phone?.trim() || <NotUpdated />}</span></li>
            <li><Mail size={15} /><span>{c.email || <NotUpdated />}</span></li>
            <li><Cake size={15} /><span>{fmtDate(c.dateOfBirth) ?? <NotUpdated />}</span></li>
            <li><MapPin size={15} /><span>{c.address?.trim() || <NotUpdated />}</span></li>
          </ul>

          <div className="cm-stats">
            <div className="cm-stat">
              <b>{c.surveyCount ?? c.surveyResponseCount ?? c.surveyResponses?.length ?? 0}</b>
              <span>Số khảo sát</span>
            </div>
            <div className="cm-stat">
              <b>{selectedFeedbacks.length}</b>
              <span>Lượt đánh giá</span>
            </div>
            <div className="cm-stat">
              <b>{selectedFeedbacks.length ? avgRating.toFixed(1) : '—'}</b>
              <span>Điểm trung bình</span>
            </div>
          </div>

          <section className="cm-preferences-card">
            <h4 className="cm-section-title"><UserRound size={15} /> Sở thích khách hàng</h4>
            <div className="pref-badges cm-prefs">
              {prefs.length === 0
                ? <span className="text-muted" style={{ fontSize: 12.5 }}>Chưa có sở thích</span>
                : prefs.map((p, idx) => (
                  <span key={`${c.customerId}-${p.categoryId}-${idx}`} className="pref-badge">{p.categoryName}</span>
                ))}
            </div>
          </section>
        </div>

        <div className="cm-detail-footer">
          <button className="btn btn-secondary" onClick={() => handleLock(c)} disabled={actionLoadingId === c.customerId}>
            {c.isLocked ? <><Unlock size={15} /> Mở khóa</> : <><Lock size={15} /> Khóa</>}
          </button>
          <button className="btn btn-danger-soft" onClick={() => handleDelete(c)}>
            <Trash2 size={15} /> Xóa
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý khách hàng</h1>
          <p className="page-subtitle">Chọn khách hàng ở danh sách để xem chi tiết, khóa/mở khóa hoặc xóa</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Thêm khách hàng
        </button>
      </div>

      <div className="customer-filter-block">
        <form className="customer-search-toolbar" onSubmit={handleApplySearch}>
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
          <button type="submit" className="customer-search__submit">
            <Search size={16} /> Tìm kiếm
          </button>
        </form>

        <div className="customer-adv-row">
          <select className="customer-select" value={filters.status} onChange={(e) => setFilter('status', e.target.value as StatusFilter)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
          <select className="customer-select" value={filters.gender} onChange={(e) => setFilter('gender', e.target.value as GenderFilter)}>
            <option value="ALL">Tất cả giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
          <select className="customer-select" value={filters.pref} onChange={(e) => setFilter('pref', e.target.value)}>
            <option value="ALL">Tất cả sở thích</option>
            {categoryOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="customer-select" value={sortBy} onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}>
            <option value="NEWEST">Mới đăng ký nhất</option>
            <option value="OLDEST">Cũ nhất</option>
            <option value="NAME_ASC">Tên A → Z</option>
            <option value="NAME_DESC">Tên Z → A</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><p>Đang tải...</p></div>
      ) : customers.length === 0 ? (
        <div className="empty-state"><p>Không có khách hàng nào</p></div>
      ) : (
        <div className="cm-layout">
          {/* ===== MAIN: danh sách ===== */}
          <section className="cm-main">
            <div className="cm-main__title">Danh sách khách hàng <span className="text-muted">({total})</span></div>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th className="col-id">Mã KH</th>
                    <th className="col-name">Họ và tên</th>
                    <th className="col-email">Email</th>
                    <th className="col-phone">SĐT</th>
                    <th className="col-gender">Giới tính</th>
                    <th className="col-status">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const fullName = fullNameOf(c);
                    return (
                      <tr
                        key={c.customerId}
                        className={`cm-row-click ${c.customerId === selectedId ? 'is-selected' : ''}`}
                        onClick={() => setSelectedId(c.customerId)}
                      >
                        <td className="col-id text-muted">{c.customerId}</td>
                        <td className="col-name">
                          <div className="customer-fullname">{fullName?.trim() || '—'}</div>
                        </td>
                        <td className="col-email">
                          {c.email
                            ? <span className="customer-email" title={c.email}>{c.email}</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td className="col-phone">{c.phone?.trim() ? c.phone : <NotUpdated />}</td>
                        <td className="col-gender">
                          {c.gender?.trim() || <span className="text-muted">—</span>}
                        </td>
                        <td className="col-status">
                          <span className={`status-badge ${c.isLocked ? 'badge-rejected' : 'badge-approved'}`}>
                            {c.isLocked ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={ITEMS_PER_PAGE} itemLabel="khách hàng" onPageChange={setPage} />
          </section>

          {/* ===== SUB: chi tiết ===== */}
          <aside className="cm-sub">{renderDetail()}</aside>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={closeAdd}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm khách hàng mới</h3>
              <button className="modal-close-btn" onClick={closeAdd}><X size={20} /></button>
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
              <div className="form-group">
                <label className="form-label">Họ *</label>
                <input className="form-input" maxLength={50} placeholder="VD: Nguyễn Văn" value={form.lastName} onChange={setF('lastName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Tên *</label>
                <input className="form-input" maxLength={50} placeholder="VD: An" value={form.firstName} onChange={setF('firstName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày sinh *</label>
                <input type="date" className="form-input" min={MIN_DOB} max={todayISO()} value={form.dateOfBirth} onChange={setF('dateOfBirth')} />
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
                <label className="form-label">Tỉnh/Thành phố</label>
                <select className="form-input" value={addr.province}
                  onChange={(e) => setAddr({ ...addr, province: e.target.value, ward: '' })}>
                  <option value="">-- Chọn Tỉnh/Thành --</option>
                  {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Phường/Xã</label>
                <select className="form-input" value={addr.ward} disabled={!addr.province}
                  onChange={(e) => setAddr({ ...addr, ward: e.target.value })}>
                  <option value="">-- Chọn Phường/Xã --</option>
                  {wardOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Số nhà, tên đường</label>
                <input className="form-input" maxLength={150} placeholder="VD: 12 Lê Lợi" value={addr.street}
                  onChange={(e) => setAddr({ ...addr, street: e.target.value })} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAdd}>Hủy</button>
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
