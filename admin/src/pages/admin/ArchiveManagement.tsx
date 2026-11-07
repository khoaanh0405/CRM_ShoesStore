import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Search, X } from 'lucide-react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import api, { getAccounts } from '../../services/api';
import Pagination from '../../components/Pagination';
import { showConfirm } from '../../lib/dialog';
import { fullNameOf } from '../../utils/name';
import './ArchiveManagement.css';

interface RoleLite { roleId: number; roleName: string }
interface PersonProfile {
  firstName?: string | null; lastName?: string | null; phone?: string | null; gender?: string | null;
  address?: string | null; dateOfBirth?: string | null; email?: string | null; isDeleted?: boolean; deletedAt?: string | null;
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
const errMsg = (e: any, fallback: string) => e?.response?.data?.message ?? fallback;
const profileOf = (a: AccountRow) => a.employee ?? a.customer ?? null;
const nameOf = (a: AccountRow) => fullNameOf(profileOf(a));
const emailOf = (a: AccountRow) => a.email || a.employee?.email || a.customer?.email || '';
const shortAddress = (addr?: string | null) => {
  const parts = (addr ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return parts.slice(-2).join(', ');
};
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');

const ArchiveManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDraft, setSearchDraft] = useState('');
  const [filters, setFilters] = useState({ search: '' });
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      const accs = await getAccounts();
      const deletedAccs = (accs ?? []).filter((a: AccountRow) => {
        const prof = profileOf(a);
        return prof?.isDeleted === true;
      });
      setAccounts(deletedAccs);
    } catch (e) {
      if (!silent) toast.error(errMsg(e, 'Không tải được danh sách tài khoản lưu trữ'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(() => load(true), 5000);

  const filtered = useMemo(() => {
    const k = filters.search.trim().toLowerCase();
    return accounts.filter((a) => {
      return (
        !k ||
        a.username.toLowerCase().includes(k) ||
        emailOf(a).toLowerCase().includes(k) ||
        nameOf(a).toLowerCase().includes(k)
      );
    });
  }, [accounts, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const rows = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchDraft });
    setPage(1);
  };

  const clearSearch = () => {
    setSearchDraft('');
    setFilters({ search: '' });
    setPage(1);
  };

  const handleRestore = async (a: AccountRow) => {
    const ok = await showConfirm({
      title: 'Khôi phục tài khoản?',
      message: `Tài khoản "${a.username}" sẽ được khôi phục trở lại hệ thống.`,
      confirmLabel: 'Khôi phục', tone: 'info',
    });
    if (!ok) return;
    setBusyId(a.accountId);
    try {
      await api.patch(`/accounts/${a.accountId}/restore`);
      toast.success('Đã khôi phục tài khoản thành công');
      await load();
    } catch (e) {
      toast.error(errMsg(e, 'Khôi phục thất bại'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="archive-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lưu trữ tài khoản</h1>
          <p className="page-subtitle">Danh sách các tài khoản đã bị xóa.</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div className="archive-filter-block">
            <form className="archive-toolbar" onSubmit={applyFilters}>
              <label className="archive-toolbar__search">
                <Search size={16} className="archive-toolbar__search-icon" />
                <input
                  className="archive-toolbar__search-input"
                  placeholder="Tìm kiếm tài khoản đã xóa theo tên, email..."
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                />
                {searchDraft && (
                  <button type="button" className="archive-toolbar__search-reset" onClick={clearSearch} title="Xóa từ khóa">
                    <X size={13} />
                  </button>
                )}
              </label>
              <button type="submit" className="archive-toolbar__submit"><Search size={16} /> Tìm kiếm</button>
            </form>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th className="archive-col-id">Mã</th>
                <th className="archive-col-name">Họ và tên</th>
                <th className="archive-col-phone">SĐT</th>
                <th className="archive-col-email">Email</th>
                <th className="archive-col-address">Địa chỉ</th>
                <th className="archive-col-date">Ngày xóa</th>
                <th className="archive-col-actions text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-muted py-8">Đang tải...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-8">Không có tài khoản nào trong Lưu trữ</td></tr>
              ) : rows.map((a) => {
                const profile = profileOf(a);
                const phone = profile?.phone?.trim();
                const address = shortAddress(profile?.address);
                const email = emailOf(a);
                const deletedAt = profile?.deletedAt;
                return (
                  <tr key={a.accountId}>
                    <td className="archive-col-id text-muted">{a.accountId}</td>
                    <td className="archive-col-name font-medium">
                      <span className="archive-cell-name">{nameOf(a) || <span className="text-muted">{a.username}</span>}</span>
                    </td>
                    <td className="archive-col-phone">{phone || <span className="text-muted">—</span>}</td>
                    <td className="archive-col-email">
                      {email ? <span className="archive-cell-email" title={email}>{email}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="archive-col-address">
                      {address ? <span className="archive-cell-address" title={address}>{address}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="archive-col-date">{fmtDate(deletedAt)}</td>
                    <td className="archive-col-actions">
                      <div className="actions-cell">
                        <button
                          className="action-btn-text restore-btn"
                          onClick={() => handleRestore(a)}
                          disabled={busyId === a.accountId}
                        >
                          <RefreshCw size={13} /> Khôi phục
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
          itemLabel="tài khoản đã xóa"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default ArchiveManagement;