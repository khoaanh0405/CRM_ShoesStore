import { useEffect, useMemo, useState } from 'react';
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
}

const ITEMS_PER_PAGE = 10;

const CustomersPage = () => {
  const [all, setAll] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
  });

  const load = async () => {
  setLoading(true);
  try {
    const res = await api.get('/customers');
    setAll(res.data?.data ?? res.data ?? []);
  } catch (e: any) {
    toast.error(e.response?.data?.message ?? 'Không tải được khách hàng');
  } finally {
    setLoading(false);
  }
};

// ✅ Thêm lại effect này — đây chính là phần bị thiếu
useEffect(() => {
  load();
}, []);

  const filtered = useMemo(() => {
    const k = search.trim().toLowerCase();

    if (!k) return all;

    return all.filter(
      (c) =>
        c.fullName.toLowerCase().includes(k) ||
        (c.phone ?? '').includes(k)
    );
  }, [all, search]);

  const total = filtered.length;

  const customers = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

// Thêm: tự lùi trang khi trang hiện tại vượt quá tổng số trang sau khi xóa/lọc
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleAdd = async () => {
  // Validate trước khi gọi API, khớp đúng yêu cầu bắt buộc của
  // backend (account.validator.js#createCustomerByAdmin): username,
  // password (>=6 ký tự), fullName, dateOfBirth đều required.
  if (
    !form.username.trim() ||
    !form.password ||
    !form.fullName.trim() ||
    !form.dateOfBirth
  ) {
    toast.error('Vui lòng nhập đầy đủ Username, mật khẩu, họ tên và ngày sinh.');
    return;
  }
  if (form.password.length < 6) {
    toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
    return;
  }

  setSaving(true);

  try {
    await api.post('/admin/customers', {
      ...form,
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    });

    toast.success('✅ Đã thêm khách hàng');

    setShowAdd(false);

    setForm({
      username: '',
      password: '',
      fullName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      address: '',
    });

    load();
  } catch (e: any) {
    toast.error(
      e.response?.data?.message ?? 'Thêm thất bại'
    );
  } finally {
    setSaving(false);
  }
};

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa (mềm) khách hàng này?')) return;

    try {
      await api.delete(`/customers/${id}`);

      toast.success('Đã xóa khách hàng');

      load();
    } catch (e: any) {
      toast.error(
        e.response?.data?.message ?? 'Xóa thất bại'
      );
    }
  };

  return (
    <div className="customers-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Quản lý khách hàng
          </h1>

          <p className="page-subtitle">
            Thêm, khóa/mở khóa và xóa khách hàng
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={16} />
          Thêm khách hàng
        </button>
      </div>

      <div className="search-box-enhanced">
        <Search
          size={16}
          className="search-icon"
        />

        <input
          className="search-input"
          placeholder="Tìm theo tên/SĐT..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        {search && (
          <button
            className="search-clear-btn"
            onClick={() => {
              setSearch('');
              setPage(1);
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Đang tải...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <p>Không có khách hàng nào</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>SĐT</th>
                <th>Giới tính</th>
                <th>Sở thích</th>
                <th>Trạng thái</th>
                <th className="col-actions">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c) => (
                <tr key={c.customerId}>
                  <td className="font-medium">
                    {c.fullName}
                  </td>

                  <td>{c.phone || '—'}</td>

                  <td>{c.gender || '—'}</td>

                  <td>
                    {(c.preferences ?? []).length === 0 ? (
                      <span className="text-muted">
                        —
                      </span>
                    ) : (
                      <div className="pref-badges">
                        {c.preferences!.slice(0, 2).map((p, idx) => (
                          <span key={`${c.customerId}-${p.tag}-${idx}`} className="pref-badge">
                            {p.tag}
                          </span>
                        ))}

                        {c.preferences!.length > 2 && (
                          <span className="pref-badge more">
                            +
                            {c.preferences!.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        c.isLocked
                          ? 'badge-rejected'
                          : 'badge-approved'
                      }`}
                    >
                      {c.isLocked
                        ? 'Đã khóa'
                        : 'Hoạt động'}
                    </span>
                  </td>

                  <td className="col-actions">
                    <div className="action-group">
                      <button
                        className="action-btn toggle-off-btn"
                        onClick={() => handleLock(c)}
                        disabled={actionLoadingId === c.customerId}
                      >
                        {c.isLocked ? 'Mở khóa' : 'Khóa'}
                      </button>

                      <button
                        className="action-btn delete-btn"
                        onClick={() =>
                          handleDelete(c.customerId)
                        }
                      >
                        Xóa
                      </button>
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
        <div
          className="modal-overlay"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Thêm khách hàng mới</h3>

              <button
                className="modal-close-btn"
                onClick={() => setShowAdd(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body modal-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Username
                </label>

                <input
                  className="form-input"
                  value={form.username}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      username: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mật khẩu
                </label>

                <input
                  type="password"
                  className="form-input"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  Họ tên
                </label>

                <input
                  className="form-input"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fullName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Ngày sinh
                </label>

                <input
                  type="date"
                  className="form-input"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dateOfBirth: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Giới tính</label>
                <select
                  className="form-input"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  SĐT
                </label>

                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  Địa chỉ
                </label>

                <input
                  className="form-input"
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAdd(false)}
              >
                Hủy
              </button>

              <button
                className="btn btn-primary"
                onClick={handleAdd}
                disabled={saving}
              >
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