import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, X, Phone, Mail, Cake, MapPin, Briefcase, CalendarDays, UserRound, Lock, LockOpen, Trash2, Users } from 'lucide-react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import api, { getAccounts } from '../../services/api';
import Pagination from '../../components/Pagination';
import { useAuthStore } from '../../store/useAuthStore';
import { showConfirm } from '../../lib/dialog';
import { normalizeEmail, validateEmail, validateNewPassword, PASSWORD_HINT } from '../../utils/validation';
import { fullNameOf } from '../../utils/name';
import { PROVINCES, EMPTY_ADDRESS, composeAddress, validateAddressParts, type AddressParts } from '../../constants/vnAddress';
import './AccountManagement.css';

interface RoleLite { roleId: number; roleName: string }
interface PersonProfile {
  firstName?: string | null; lastName?: string | null; phone?: string | null; gender?: string | null;
  address?: string | null; dateOfBirth?: string | null; email?: string | null; isDeleted?: boolean;
}
interface AccountRow {
  accountId: number;
  username: string;
  email?: string | null;
  isLocked: boolean;
  createdAt: string;
  role?: RoleLite;
  customer?: PersonProfile | null;
  employee?: (PersonProfile & { position?: string | null; hireDate?: string | null }) | null;
}

const ITEMS_PER_PAGE = 10;
const CREATE_ROLES = ['Admin', 'Manager', 'Customer'] as const;
type CreateRole = (typeof CREATE_ROLES)[number];

type TabKey = 'STAFF' | 'CUSTOMER';
const STAFF_ROLES = ['Admin', 'Manager'];
const isCustomerAccount = (a: AccountRow) => a.role?.roleName === 'Customer';
const TAB_META: Record<TabKey, { label: string; addLabel: string; itemLabel: string; subtitle: string }> = {
  STAFF: {
    label: 'Nhân sự', addLabel: 'Thêm tài khoản', itemLabel: 'tài khoản nhân sự',
    subtitle: 'Chọn tài khoản ở danh sách để xem chi tiết, khóa/mở khóa, đổi vai trò hoặc xóa.',
  },
  CUSTOMER: {
    label: 'Khách hàng', addLabel: 'Thêm khách hàng', itemLabel: 'khách hàng',
    subtitle: 'Chọn khách hàng ở danh sách để xem chi tiết, khóa/mở khóa hoặc xóa.',
  },
};

const ROLE_LABELS: Record<string, string> = { Admin: 'Admin', Manager: 'Manager', Customer: 'Khách hàng' };
const ROLE_CLASS: Record<string, string> = {
  Admin: 'role-admin', Manager: 'role-manager', Customer: 'role-customer',
};

const errMsg = (e: any, fallback: string) => e?.response?.data?.message ?? fallback;
const profileOf = (a: AccountRow) => a.employee ?? a.customer ?? null;
const nameOf = (a: AccountRow) => fullNameOf(profileOf(a));
const emailOf = (a: AccountRow) => a.email || a.employee?.email || a.customer?.email || '';
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');
const ageOf = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
};

const EMPTY_FORM = {
  roleName: 'Manager' as CreateRole,
  username: '', lastName: '', firstName: '', email: '', phone: '', password: '',
  dateOfBirth: '', gender: '', address: '',
  hireDate: '',
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const MIN_DOB = '1900-01-01';

const SELECT_ARROW =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")";

const SELECT_STYLE: React.CSSProperties = {
  appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: 36,
  backgroundImage: SELECT_ARROW, backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center', backgroundSize: 16,
};

const AccountManagement: React.FC = () => {
  const me = useAuthStore((s) => s.user);

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [roles, setRoles] = useState<RoleLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('STAFF');

  const [searchDraft, setSearchDraft] = useState('');
  const [filters, setFilters] = useState({ search: '', role: 'ALL', status: 'ALL', dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [roleChange, setRoleChange] = useState<{ account: AccountRow; roleName: string } | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  const [extra, setExtra] = useState<{ surveys: number; feedbacks: number; avg: number | null; prefs: string[] } | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [addr, setAddr] = useState<AddressParts>({ ...EMPTY_ADDRESS });
  const wardOptions = useMemo(() => PROVINCES.find((p) => p.name === addr.province)?.wards ?? [], [addr.province]);
  const resetAddr = () => setAddr({ ...EMPTY_ADDRESS });

  const load = useCallback(async (silent = false) => {
    try {
      const [accs, rolesRes] = await Promise.all([
        getAccounts(),
        api.get('/roles').then((r) => r.data?.data ?? r.data ?? []).catch(() => []),
      ]);
      // Lọc bỏ những tài khoản đã bị xóa mềm
      const activeAccs = (accs ?? []).filter((a: AccountRow) => {
        const prof = profileOf(a);
        return !prof?.isDeleted;
      });
      setAccounts(activeAccs);
      setRoles(rolesRes);
    } catch (e) {
      if (!silent) toast.error(errMsg(e, 'Không tải được danh sách tài khoản'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true), 5000);

  const roleOptions: RoleLite[] = useMemo(() => {
    if (roles.length) return roles;
    const map = new Map<number, RoleLite>();
    accounts.forEach((a) => a.role && map.set(a.role.roleId, a.role));
    return Array.from(map.values());
  }, [roles, accounts]);

  const filtered = useMemo(() => {
    const k = filters.search.trim().toLowerCase();
    return accounts
      .filter((a) => {
        const matchSearch =
          !k ||
          a.username.toLowerCase().includes(k) ||
          emailOf(a).toLowerCase().includes(k) ||
          nameOf(a).toLowerCase().includes(k);
        const matchTab = tab === 'CUSTOMER' ? isCustomerAccount(a) : !isCustomerAccount(a);
        const matchRole = tab === 'CUSTOMER' || filters.role === 'ALL' || a.role?.roleName === filters.role;
        const matchStatus = filters.status === 'ALL' || (filters.status === 'LOCKED') === a.isLocked;
        const created = new Date(a.createdAt).getTime();
        const matchFrom = !filters.dateFrom || created >= new Date(`${filters.dateFrom}T00:00:00`).getTime();
        const matchTo = !filters.dateTo || created <= new Date(`${filters.dateTo}T23:59:59.999`).getTime();
        return matchTab && matchSearch && matchRole && matchStatus && matchFrom && matchTo;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        const validA = Number.isFinite(timeA);
        const validB = Number.isFinite(timeB);

        if (validA && validB && timeA !== timeB) return timeB - timeA;
        if (validA !== validB) return validA ? -1 : 1;
        return b.accountId - a.accountId;
      });
  }, [accounts, filters, tab]);

  const tabCounts = useMemo(() => {
    const customers = accounts.filter(isCustomerAccount).length;
    return { STAFF: accounts.length - customers, CUSTOMER: customers } as Record<TabKey, number>;
  }, [accounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const rows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Tài khoản đang được chọn (luôn lấy bản mới nhất từ danh sách để auto-refresh cập nhật theo)
  const selected = useMemo(
    () => accounts.find((a) => a.accountId === selectedId) ?? null,
    [accounts, selectedId],
  );

  // Tự chọn dòng đầu tiên khi chưa chọn gì (hoặc tài khoản đang chọn đã bị xóa / không còn trong tab)
  useEffect(() => {
    if (loading) return;
    const stillVisible = selectedId !== null && filtered.some((a) => a.accountId === selectedId);
    if (!stillVisible) setSelectedId(rows.length ? rows[0].accountId : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, filtered, page]);

  // Thống kê / sở thích của khách hàng đang chọn (customerId = accountId)
  const selectedCustomerId = selected && isCustomerAccount(selected) ? selected.accountId : null;
  useEffect(() => {
    if (selectedCustomerId === null) { setExtra(null); return; }
    let cancelled = false;
    const list = (p: string) => api.get(p).then((r) => {
      const d = r.data?.data ?? r.data ?? [];
      return Array.isArray(d) ? d : [];
    }).catch(() => []);
    Promise.all([
      list(`/customers/${selectedCustomerId}/responses`),
      list(`/customers/${selectedCustomerId}/feedbacks`),
      list(`/customers/${selectedCustomerId}/preferences`),
    ]).then(([resp, fbs, prefs]) => {
      if (cancelled) return;
      const ratings = fbs.map((f: any) => Number(f.rating)).filter((n: number) => Number.isFinite(n));
      setExtra({
        surveys: resp.length,
        feedbacks: fbs.length,
        avg: ratings.length ? ratings.reduce((s: number, n: number) => s + n, 0) / ratings.length : null,
        prefs: prefs.map((p: any) => p.preferenceTag).filter(Boolean),
      });
    });
    return () => { cancelled = true; };
  }, [selectedCustomerId]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchDraft }));
    setPage(1);
  };
  const setFilter = (key: 'role' | 'status' | 'dateFrom' | 'dateTo', value: string) => {
    const next = { ...filters, [key]: value };
    if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
      toast.error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    setFilters(next);
    setPage(1);
  };
  const switchTab = (next: TabKey) => {
    if (next === tab) return;
    setTab(next);
    setSelectedId(null);
    setSearchDraft('');
    setFilters({ search: '', role: 'ALL', status: 'ALL', dateFrom: '', dateTo: '' });
    setPage(1);
  };
  const clearSearch = () => {
    setSearchDraft('');
    setFilters((f) => ({ ...f, search: '' }));
    setPage(1);
  };

  const toggleLock = async (a: AccountRow) => {
    setBusyId(a.accountId);
    try {
      await api.patch(`/accounts/${a.accountId}/${a.isLocked ? 'unlock' : 'lock'}`);
      toast.success(a.isLocked ? '🔓 Đã mở khóa tài khoản' : '🔒 Đã khóa tài khoản');
      await load();
    } catch (e) {
      toast.error(errMsg(e, 'Thao tác thất bại'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (a: AccountRow) => {
    const ok = await showConfirm({
      title: 'Xóa tài khoản?',
      message: `Tài khoản "${a.username}" sẽ bị xóa (chuyển vào mục Lưu trữ).`,
      confirmLabel: 'Xóa', tone: 'warning', danger: true,
    });
    if (!ok) return;
    setBusyId(a.accountId);
    try {
      await api.delete(`/accounts/${a.accountId}`);
      toast.success('Đã chuyển tài khoản vào mục Lưu trữ');
      setSelectedId(null);
      await load();
    } catch (e) {
      toast.error(errMsg(e, 'Xóa thất bại'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmRoleChange = async () => {
    if (!roleChange) return;
    const role = roleOptions.find((r) => r.roleName === roleChange.roleName);
    if (!role) { toast.error('Không tìm thấy vai trò'); return; }
    setRoleSaving(true);
    try {
      await api.patch(`/accounts/${roleChange.account.accountId}/role`, { roleId: role.roleId, roleName: role.roleName });
      toast.success('Đã cập nhật vai trò');
      setRoleChange(null);
      await load();
    } catch (e) {
      toast.error(errMsg(e, 'Đổi vai trò thất bại'));
    } finally {
      setRoleSaving(false);
    }
  };

  const isCustomerForm = form.roleName === 'Customer';
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, roleName: tab === 'CUSTOMER' ? 'Customer' : 'Manager' });
    resetAddr();
    setShowAdd(true);
  };
  const closeAdd = () => { if (!saving) { setShowAdd(false); setForm(EMPTY_FORM); resetAddr(); } };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.trim();
    const personLabel = isCustomerForm ? 'khách hàng' : 'nhân sự';
    if (username.length < 4) return void toast.error('Tên đăng nhập tối thiểu 4 ký tự.');
    if (!/^[A-Za-z0-9._]+$/.test(username)) return void toast.error('Tên đăng nhập chỉ gồm chữ cái không dấu, số, dấu chấm và gạch dưới.');
    if (!form.lastName.trim()) return void toast.error(`Vui lòng nhập họ của ${personLabel}.`);
    if (!form.firstName.trim()) return void toast.error(`Vui lòng nhập tên của ${personLabel}.`);
    if (isCustomerForm && !form.dateOfBirth) return void toast.error('Vui lòng nhập ngày sinh của khách hàng.');
    if (form.dateOfBirth && (form.dateOfBirth > todayISO() || form.dateOfBirth < MIN_DOB))
      return void toast.error('Ngày sinh không hợp lệ (không được ở tương lai).');
    if (!isCustomerForm && form.hireDate && form.hireDate > todayISO())
      return void toast.error('Ngày vào làm không được ở tương lai.');
    const emailErr = validateEmail(form.email);
    if (emailErr) return void toast.error(emailErr);
    const pwErr = validateNewPassword(form.password, username);
    if (pwErr) return void toast.error(pwErr);

    const hasAnyAddr = !!(addr.street.trim() || addr.province || addr.ward);
    if (isCustomerForm || hasAnyAddr) {
      const errs = validateAddressParts(addr);
      const firstErr = errs.street || errs.province || errs.ward;
      if (firstErr) return void toast.error(firstErr);
    }
    const fullAddress = hasAnyAddr ? composeAddress(addr) : '';

    const common = {
      username,
      lastName: form.lastName.trim().replace(/\s+/g, ' '),
      firstName: form.firstName.trim().replace(/\s+/g, ' '),
      email: normalizeEmail(form.email),
      password: form.password,
    };

    setSaving(true);
    try {
      if (isCustomerForm) {
        await api.post('/admin/customers', {
          ...common,
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          phone: form.phone.trim(),
          address: fullAddress,
        });
      } else {
        await api.post('/admin/staff', {
          ...common,
          phone: form.phone.trim() || undefined,
          roleName: form.roleName,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          address: fullAddress || undefined,
          hireDate: form.hireDate || undefined,
        });
      }
      toast.success(`✅ Đã tạo tài khoản ${ROLE_LABELS[form.roleName]}`);
      const targetTab: TabKey = form.roleName === 'Customer' ? 'CUSTOMER' : 'STAFF';
      if (targetTab !== tab) switchTab(targetTab);
      setShowAdd(false);
      setForm(EMPTY_FORM);
      resetAddr();
      await load();
    } catch (err) {
      toast.error(errMsg(err, 'Tạo tài khoản thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)' };
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 };

  const colCount = tab === 'STAFF' ? 6 : 5;

  /** ===== Form phụ (Sub form): chi tiết tài khoản đang chọn ===== */
  const renderDetailPanel = () => {
    if (!selected) {
      return (
        <aside className="acc-detail-panel acc-detail-panel--empty">
          <Users size={32} />
          <p>Chọn một tài khoản ở danh sách bên trái để xem chi tiết.</p>
        </aside>
      );
    }
    const a = selected;
    const profile = profileOf(a);
    const roleName = a.role?.roleName ?? '';
    const isSelf = a.accountId === me?.accountId;
    const busy = busyId === a.accountId;
    const displayName = nameOf(a) || a.username;
    const age = ageOf(profile?.dateOfBirth);
    const sub = [profile?.gender, age !== null ? `${age} tuổi` : null].filter(Boolean).join(' · ');
    const orNA = (v?: string | null) => (v && v.trim() ? v : 'Chưa cập nhật');
    const dobText = profile?.dateOfBirth ? fmtDate(profile.dateOfBirth) : null;

    const isCustomer = isCustomerAccount(a);
    const infos: { icon: React.ReactNode; text: string; empty?: boolean }[] = [
      { icon: <UserRound size={16} />, text: isCustomer ? `Mã khách hàng: ${a.accountId}` : `Mã tài khoản: ${a.accountId} · ${a.username}` },
      { icon: <Phone size={16} />, text: orNA(profile?.phone), empty: !profile?.phone?.trim() },
      { icon: <Mail size={16} />, text: orNA(emailOf(a)), empty: !emailOf(a) },
      { icon: <Cake size={16} />, text: orNA(dobText), empty: !dobText },
      { icon: <MapPin size={16} />, text: orNA(profile?.address), empty: !profile?.address?.trim() },
    ];
    if (a.employee) {
      infos.push(
        { icon: <Briefcase size={16} />, text: `Chức vụ: ${orNA(a.employee.position)}` },
        { icon: <CalendarDays size={16} />, text: `Vào làm: ${orNA(a.employee.hireDate ? fmtDate(a.employee.hireDate) : null)}` },
      );
    }

    return (
      <aside className="acc-detail-panel">
        <div className="acc-detail-hero">
          <div className="acc-detail-avatar">{displayName.trim().charAt(0).toUpperCase()}</div>
          <div className="acc-detail-hero__info">
            <div className="acc-detail-name">{displayName}</div>
            <div className="acc-detail-sub">
              {sub && <span>{sub}</span>}
              {!isCustomer && (
                <span className={`role-badge-static ${ROLE_CLASS[roleName] ?? 'role-customer'}`}>
                  {ROLE_LABELS[roleName] ?? roleName}
                </span>
              )}
              <span className={`status-badge ${a.isLocked ? 'status-locked' : 'status-active'}`}>
                {a.isLocked ? 'Đã khóa' : 'Hoạt động'}
              </span>
            </div>
          </div>
        </div>

        <ul className="acc-info-list">
          {infos.map((it, i) => (
            <li key={i} className="acc-info-row">
              <span className="acc-info-icon">{it.icon}</span>
              <span className={`acc-info-text ${it.empty ? 'is-empty' : ''}`}>{it.text}</span>
            </li>
          ))}
        </ul>

        {isCustomer && (
          <>
            <div className="acc-stat-grid">
              <div className="acc-stat">
                <b>{extra ? extra.surveys : '—'}</b>
                <span>Số khảo sát</span>
              </div>
              <div className="acc-stat">
                <b>{extra ? extra.feedbacks : '—'}</b>
                <span>Lượt đánh giá</span>
              </div>
              <div className="acc-stat">
                <b>{extra && extra.avg !== null ? extra.avg.toFixed(1) : '—'}</b>
                <span>Điểm trung bình</span>
              </div>
            </div>

            <div className="acc-pref">
              <h4 className="acc-pref__title"><UserRound size={16} /> Sở thích khách hàng</h4>
              <div className="acc-pref__box">
                {extra && extra.prefs.length > 0
                  ? extra.prefs.map((p) => <span key={p} className="acc-pref__chip">{p}</span>)
                  : <span className="acc-pref__empty">Chưa có sở thích</span>}
              </div>
            </div>
          </>
        )}

        {!isCustomer && (
          <div className="acc-detail-role">
            <label className="acc-detail-label" htmlFor="acc-detail-role-select">Đổi vai trò</label>
            <select
              id="acc-detail-role-select"
              className="form-select"
              value={roleName}
              disabled={isSelf}
              title={isSelf ? 'Không thể đổi vai trò của chính mình' : 'Đổi vai trò'}
              onChange={(e) => {
                if (e.target.value === roleName) return;
                setRoleChange({ account: a, roleName: e.target.value });
              }}
            >
              {(roleOptions.length ? roleOptions.map((r) => r.roleName) : [roleName]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
              ))}
            </select>
          </div>
        )}

        <div className="acc-detail-actions">
          <button
            className="acc-act-btn acc-act-btn--lock"
            onClick={() => toggleLock(a)}
            disabled={busy || isSelf}
            title={isSelf ? 'Không thể khóa chính mình' : undefined}
          >
            {a.isLocked ? <><LockOpen size={16} /> Mở khóa</> : <><Lock size={16} /> Khóa</>}
          </button>
          <button
            className="acc-act-btn acc-act-btn--delete"
            onClick={() => handleDelete(a)}
            disabled={busy || isSelf}
            title={isSelf ? 'Không thể xóa chính mình' : undefined}
          >
            <Trash2 size={16} /> Xóa
          </button>
        </div>
      </aside>
    );
  };

  return (
    <div className="account-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý tài khoản</h1>
          <p className="page-subtitle">{TAB_META[tab].subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> {TAB_META[tab].addLabel}
          </button>
        </div>
      </div>

      <div className="acc-tabs" role="tablist" aria-label="Nhóm tài khoản">
        {(Object.keys(TAB_META) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`acc-tab ${tab === key ? 'acc-tab--active' : ''}`}
            onClick={() => switchTab(key)}
          >
            {TAB_META[key].label}
            <span className="acc-tab__count">{tabCounts[key]}</span>
          </button>
        ))}
      </div>

      {/* ===== Bộ lọc ===== */}
      <div className="acc-filter-block">
        <form className="acc-toolbar" onSubmit={applyFilters}>
          <label className="acc-toolbar__search">
            <Search size={16} className="acc-toolbar__search-icon" />
            <input
              className="acc-toolbar__search-input"
              placeholder={tab === 'CUSTOMER' ? 'Tìm theo tên đăng nhập, email, họ tên khách hàng...' : 'Tìm theo tên đăng nhập, email, họ tên...'}
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            {searchDraft && (
              <button type="button" className="acc-toolbar__search-reset" onClick={clearSearch} title="Xóa từ khóa">
                <X size={13} />
              </button>
            )}
          </label>
          <button type="submit" className="acc-toolbar__submit"><Search size={16} /> Tìm kiếm</button>
        </form>

        <div className="acc-adv-row">
          {tab === 'STAFF' && (
            <select className="form-select" value={filters.role} onChange={(e) => setFilter('role', e.target.value)}>
              <option value="ALL">Tất cả vai trò</option>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          )}
          <select className="form-select" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
          <div className="acc-date-range">
            <span className="acc-date-range__label">Ngày tạo từ</span>
            <input type="date" className="acc-date" value={filters.dateFrom} max={filters.dateTo || undefined}
              onChange={(e) => setFilter('dateFrom', e.target.value)} />
            <span className="acc-date-range__label">đến</span>
            <input type="date" className="acc-date" value={filters.dateTo} min={filters.dateFrom || undefined}
              onChange={(e) => setFilter('dateTo', e.target.value)} />
          </div>
        </div>
      </div>

      {/* ===== Main (danh sách) — Sub (chi tiết) ===== */}
      <div className="acc-layout">
        <div className="table-card">
          <div className="table-card__head">
            Danh sách {TAB_META[tab].itemLabel} <span className="table-card__count">({filtered.length})</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="acc-col-id">Mã</th>
                  <th className="acc-col-name">Họ và tên</th>
                  <th className="acc-col-email">Email</th>
                  <th className="acc-col-phone">SĐT</th>
                  {tab === 'STAFF' && <th className="acc-col-role">Vai trò</th>}
                  <th className="acc-col-status">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={colCount} className="text-center text-muted py-8">Đang tải...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={colCount} className="text-center text-muted py-8">Không có {TAB_META[tab].itemLabel} nào</td></tr>
                ) : rows.map((a) => {
                  const profile = profileOf(a);
                  const phone = profile?.phone?.trim();
                  const email = emailOf(a);
                  const roleName = a.role?.roleName ?? '';
                  const isActiveRow = a.accountId === selectedId;
                  return (
                    <tr
                      key={a.accountId}
                      className={`acc-row ${isActiveRow ? 'acc-row--selected' : ''}`}
                      onClick={() => setSelectedId(a.accountId)}
                      aria-selected={isActiveRow}
                    >
                      <td className="acc-col-id text-muted">{a.accountId}</td>
                      <td className="acc-col-name font-medium">
                        <span className="acc-cell-name">{nameOf(a) || <span className="text-muted">{a.username}</span>}</span>
                      </td>
                      <td className="acc-col-email">
                        {email ? <span className="acc-cell-email" title={email}>{email}</span> : <span className="text-muted">—</span>}
                      </td>
                      <td className="acc-col-phone">{phone || <span className="text-muted">—</span>}</td>
                      {tab === 'STAFF' && (
                        <td className="acc-col-role">
                          <span className={`role-badge-static ${ROLE_CLASS[roleName] ?? 'role-customer'}`}>
                            {ROLE_LABELS[roleName] ?? roleName}
                          </span>
                        </td>
                      )}
                      <td className="acc-col-status">
                        <span className={`status-badge ${a.isLocked ? 'status-locked' : 'status-active'}`}>
                          {a.isLocked ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel={TAB_META[tab].itemLabel}
            onPageChange={setPage}
          />
        </div>

        {renderDetailPanel()}
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={closeAdd}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm tài khoản mới</h2>
              <button className="close-btn" onClick={closeAdd}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div className="form-group" style={fieldStyle}>
                  <label style={labelStyle}>Vai trò *</label>
                  <select
                    value={form.roleName}
                    disabled={saving}
                    onChange={(e) => setForm({ ...form, roleName: e.target.value as CreateRole })}
                    style={{ ...SELECT_STYLE, fontWeight: 600 }}
                  >
                    {CREATE_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={fieldStyle}>
                  <label style={labelStyle}>Tên đăng nhập *</label>
                  <input value={form.username} maxLength={50} autoFocus autoComplete="off"
                    onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={fieldStyle}>
                    <label style={labelStyle}>Họ *</label>
                    <input value={form.lastName} maxLength={50} autoComplete="off" placeholder="VD: Nguyễn Văn"
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label style={labelStyle}>Tên *</label>
                    <input value={form.firstName} maxLength={50} autoComplete="off" placeholder="VD: An"
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={form.email} maxLength={100} autoComplete="off" placeholder="ten@gmail.com"
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label style={labelStyle}>Số điện thoại</label>
                  <input value={form.phone} maxLength={20} autoComplete="off" inputMode="tel"
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+\s.-]/g, '') })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={fieldStyle}>
                    <label style={labelStyle}>Ngày sinh{isCustomerForm ? ' *' : ''}</label>
                    <input type="date" value={form.dateOfBirth} min={MIN_DOB} max={todayISO()}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label style={labelStyle}>Giới tính</label>
                    <select value={form.gender} style={SELECT_STYLE}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">-- Chọn --</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={fieldStyle}>
                    <label style={labelStyle}>Tỉnh/Thành phố{isCustomerForm ? ' *' : ''}</label>
                    <select value={addr.province} style={SELECT_STYLE} disabled={saving}
                      onChange={(e) => setAddr({ ...addr, province: e.target.value, ward: '' })}>
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label style={labelStyle}>Phường/Xã{isCustomerForm ? ' *' : ''}</label>
                    <select value={addr.ward} style={SELECT_STYLE} disabled={saving || !addr.province}
                      onChange={(e) => setAddr({ ...addr, ward: e.target.value })}>
                      <option value="">-- Chọn Phường/Xã --</option>
                      {wardOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label style={labelStyle}>Số nhà, tên đường{isCustomerForm ? ' *' : ''}</label>
                  <input value={addr.street} maxLength={150} autoComplete="off" placeholder="VD: 12 Lê Lợi"
                    onChange={(e) => setAddr({ ...addr, street: e.target.value })} />
                </div>

                {!isCustomerForm && (
                  <div className="form-group" style={fieldStyle}>
                    <label style={labelStyle}>Ngày vào làm</label>
                    <input type="date" value={form.hireDate} max={todayISO()}
                      onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
                  </div>
                )}

                <div className="form-group" style={{ ...fieldStyle, marginBottom: 0 }}>
                  <label style={labelStyle}>Mật khẩu khởi tạo *</label>
                  <input type="password" value={form.password} maxLength={50} autoComplete="new-password"
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <span className="text-muted" style={{ fontSize: 12 }}>{PASSWORD_HINT}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-refresh" onClick={closeAdd} disabled={saving}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang tạo...' : `Tạo tài khoản ${ROLE_LABELS[form.roleName]}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roleChange && (
        <div className="modal-overlay" onClick={() => !roleSaving && setRoleChange(null)}>
          <div className="modal-content role-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận đổi vai trò</h2>
              <button className="close-btn" onClick={() => setRoleChange(null)} disabled={roleSaving}><X size={18} /></button>
            </div>
            <div className="role-confirm-body">
              <p className="role-confirm-message">Bạn có chắc muốn đổi vai trò của tài khoản này?</p>
              <div className="role-confirm-info">
                <div className="role-confirm-row"><span>Tài khoản</span><strong>{roleChange.account.username}</strong></div>
                <div className="role-confirm-row">
                  <span>Vai trò hiện tại</span>
                  <strong>{ROLE_LABELS[roleChange.account.role?.roleName ?? ''] ?? roleChange.account.role?.roleName}</strong>
                </div>
                <div className="role-confirm-row">
                  <span>Vai trò mới</span>
                  <strong className="role-confirm-new">{ROLE_LABELS[roleChange.roleName] ?? roleChange.roleName}</strong>
                </div>
              </div>
              <p className="role-confirm-warning">Quyền truy cập của tài khoản sẽ thay đổi ngay ở lần đăng nhập tiếp theo.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-refresh" onClick={() => setRoleChange(null)} disabled={roleSaving}>Hủy</button>
              <button className="btn-role-confirm" onClick={confirmRoleChange} disabled={roleSaving}>
                {roleSaving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
