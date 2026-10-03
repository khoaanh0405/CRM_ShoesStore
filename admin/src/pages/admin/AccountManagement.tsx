import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, X } from 'lucide-react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import api, { getAccounts } from '../../services/api';
import Pagination from '../../components/Pagination';
import { useAuthStore } from '../../store/useAuthStore';
import { normalizeEmail, validateEmail, validateNewPassword, PASSWORD_HINT } from '../../utils/validation';
import './AccountManagement.css';

interface RoleLite { roleId: number; roleName: string }
interface AccountRow {
  accountId: number;
  username: string;
  email?: string | null;
  isLocked: boolean;
  createdAt: string;
  role?: RoleLite;
  customer?: {
    fullName?: string; phone?: string | null; gender?: string | null;
    address?: string | null; dateOfBirth?: string | null; email?: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 10;
const STAFF_ROLES = ['Admin', 'Manager'] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const ROLE_LABELS: Record<string, string> = { Admin: 'Admin', Manager: 'Manager', Customer: 'Khách hàng' };
const ROLE_CLASS: Record<string, string> = {
  Admin: 'role-admin', Manager: 'role-manager', Customer: 'role-customer',
};

const errMsg = (e: any, fallback: string) => e?.response?.data?.message ?? fallback;
const emailOf = (a: AccountRow) => a.email || a.customer?.email || '';
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');

const EMPTY_FORM = { username: '', email: '', password: '', roleName: 'Manager' as StaffRole };

const AccountManagement: React.FC = () => {
  const me = useAuthStore((s) => s.user);

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [roles, setRoles] = useState<RoleLite[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc: chỉ áp dụng khi bấm "Tìm kiếm" / Enter
  const [searchDraft, setSearchDraft] = useState('');
  const [roleDraft, setRoleDraft] = useState('ALL');
  const [statusDraft, setStatusDraft] = useState('ALL');
  const [filters, setFilters] = useState({ search: '', role: 'ALL', status: 'ALL' });
  const [page, setPage] = useState(1);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AccountRow | null>(null);
  const [roleChange, setRoleChange] = useState<{ account: AccountRow; roleName: string } | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

    const load = useCallback(async (silent = false) => {
    try {
      const [accs, rolesRes] = await Promise.all([
        getAccounts(),
        api.get('/roles').then((r) => r.data?.data ?? r.data ?? []).catch(() => []),
      ]);
      setAccounts(accs);
      setRoles(rolesRes);
    } catch (e) {
      if (!silent) toast.error(errMsg(e, 'Không tải được danh sách tài khoản'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Real-time: tự cập nhật mỗi 5 giây
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
          (a.customer?.fullName ?? '').toLowerCase().includes(k);
        const matchRole = filters.role === 'ALL' || a.role?.roleName === filters.role;
        const matchStatus = filters.status === 'ALL' || (filters.status === 'LOCKED') === a.isLocked;
        return matchSearch && matchRole && matchStatus;
      })
      .sort((a, b) => {
        const rank: Record<string, number> = { Admin: 0, Manager: 1, Customer: 2 };
        const ra = rank[a.role?.roleName ?? ''] ?? 9;
        const rb = rank[b.role?.roleName ?? ''] ?? 9;
        if (ra !== rb) return ra - rb;
        const t = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return t !== 0 ? t : b.accountId - a.accountId; // mới đăng ký lên trước
      });
  }, [accounts, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const rows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchDraft, role: roleDraft, status: statusDraft });
    setPage(1);
  };
  const clearSearch = () => {
    setSearchDraft('');
    setFilters((f) => ({ ...f, search: '' }));
    setPage(1);
  };

  /* ---------- khóa / mở khóa ---------- */
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

  /* ---------- đổi vai trò ---------- */
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

  /* ---------- thêm tài khoản Admin / Manager ---------- */
  const closeAdd = () => { if (!saving) { setShowAdd(false); setForm(EMPTY_FORM); } };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.trim();
    if (username.length < 4) return void toast.error('Tên đăng nhập tối thiểu 4 ký tự.');
    if (!/^[A-Za-z0-9._]+$/.test(username)) return void toast.error('Tên đăng nhập chỉ gồm chữ cái không dấu, số, dấu chấm và gạch dưới.');
    const emailErr = validateEmail(form.email);
    if (emailErr) return void toast.error(emailErr);
    const pwErr = validateNewPassword(form.password, username);
    if (pwErr) return void toast.error(pwErr);

    setSaving(true);
    try {
      await api.post('/admin/staff', {
        username,
        email: normalizeEmail(form.email),
        password: form.password,
        roleName: form.roleName,
      });
      toast.success(`✅ Đã tạo tài khoản ${form.roleName}`);
      setShowAdd(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      toast.error(errMsg(err, 'Tạo tài khoản thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)' };
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 };

  return (
    <div className="account-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý tài khoản</h1>
          <p className="page-subtitle">Quản lý toàn bộ tài khoản hệ thống. Tài khoản khách hàng do Manager thêm.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Thêm tài khoản
            </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <form className="acc-toolbar" onSubmit={applyFilters}>
            <label className="acc-toolbar__search">
              <Search size={16} className="acc-toolbar__search-icon" />
              <input
                className="acc-toolbar__search-input"
                placeholder="Tìm theo tên đăng nhập, email, họ tên..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
              {searchDraft && (
                <button type="button" className="acc-toolbar__search-reset" onClick={clearSearch} title="Xóa từ khóa">
                  <X size={13} />
                </button>
              )}
            </label>
            <select className="form-select" value={roleDraft} onChange={(e) => setRoleDraft(e.target.value)}>
              <option value="ALL">Tất cả vai trò</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Customer">Khách hàng</option>
            </select>
            <select className="form-select" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
            </select>
            <button type="submit" className="acc-toolbar__submit"><Search size={16} /> Tìm kiếm</button>
          </form>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tài khoản</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-muted py-8">Đang tải...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-8">Không có tài khoản nào</td></tr>
              ) : rows.map((a, idx) => {
                const roleName = a.role?.roleName ?? '';
                const isSelf = a.accountId === me?.accountId;
                return (
                  <tr key={a.accountId}>
                    <td className="text-muted">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td>
                      <div className="font-medium">{a.username}</div>
                      {a.customer?.fullName && <div className="text-muted" style={{ fontSize: 12 }}>{a.customer.fullName}</div>}
                    </td>
                    <td>{emailOf(a) || <span className="text-muted">—</span>}</td>
                    <td>
                      <select
                        className={`role-badge ${ROLE_CLASS[roleName] ?? 'role-customer'}`}
                        value={roleName}
                        disabled={isSelf}
                        title={isSelf ? 'Không thể đổi vai trò của chính mình' : 'Đổi vai trò'}
                        onChange={(e) => e.target.value !== roleName && setRoleChange({ account: a, roleName: e.target.value })}
                      >
                        {(roleOptions.length ? roleOptions.map((r) => r.roleName) : [roleName]).map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
                        ))}
                      </select>
                    </td>
                    <td>{fmtDate(a.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${a.isLocked ? 'status-locked' : 'status-active'}`}>
                        {a.isLocked ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn-text view-btn" onClick={() => setDetail(a)}>Chi tiết</button>
                        <button
                          className={`action-btn-text ${a.isLocked ? 'unlock-btn' : 'lock-btn'}`}
                          onClick={() => toggleLock(a)}
                          disabled={busyId === a.accountId || isSelf}
                          title={isSelf ? 'Không thể khóa chính mình' : undefined}
                        >
                          {a.isLocked ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </div>
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
          itemLabel="tài khoản"
          onPageChange={setPage}
        />
      </div>

      {/* Thêm tài khoản Admin / Manager */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeAdd}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm tài khoản nội bộ</h2>
              <button className="close-btn" onClick={closeAdd}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                <div style={fieldStyle}>
                  <span style={labelStyle}>Vai trò *</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {STAFF_ROLES.map((r) => {
                      const on = form.roleName === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm({ ...form, roleName: r })}
                          style={{
                            flex: 1, height: 40, borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: 'pointer',
                            border: `1.5px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: on ? 'var(--color-primary)' : '#fff',
                            color: on ? '#fff' : 'var(--color-text-muted)',
                          }}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group" style={fieldStyle}>
                  <label style={labelStyle}>Tên đăng nhập *</label>
                  <input value={form.username} maxLength={50} autoFocus autoComplete="off"
                    onChange={(e) => setForm({ ...form, username: e.target.value })} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={form.email} maxLength={100} autoComplete="off"
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
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
                  {saving ? 'Đang tạo...' : `Tạo tài khoản ${form.roleName}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Xác nhận đổi vai trò */}
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

      {/* Chi tiết tài khoản */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết tài khoản</h2>
              <button className="close-btn" onClick={() => setDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="customer-details">
                {([
                  ['Tên đăng nhập', detail.username],
                  ['Email', emailOf(detail)],
                  ['Vai trò', ROLE_LABELS[detail.role?.roleName ?? ''] ?? detail.role?.roleName],
                  ['Trạng thái', detail.isLocked ? 'Đã khóa' : 'Đang hoạt động'],
                  ['Ngày tạo', fmtDate(detail.createdAt)],
                  ['Họ tên', detail.customer?.fullName],
                  ['Ngày sinh', fmtDate(detail.customer?.dateOfBirth)],
                  ['Giới tính', detail.customer?.gender],
                  ['Số điện thoại', detail.customer?.phone],
                  ['Địa chỉ', detail.customer?.address],
                ] as [string, string | null | undefined][])
                  .filter(([label, v]) => v && !(label === 'Ngày sinh' && v === '—'))
                  .map(([label, v]) => (
                    <div className="detail-item" key={label}>
                      <span className="detail-label">{label}</span>
                      <span className="detail-value">{v}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
