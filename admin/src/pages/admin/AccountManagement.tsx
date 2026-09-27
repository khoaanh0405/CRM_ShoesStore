import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, X, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import api from '../../utils/api';
import './AccountManagement.css';

interface Account {
  accountId: number;
  username: string;
  isLocked: boolean;
  createdAt: string;
  role: { roleName: string };
}

const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Admin' | 'Manager' | 'Customer'>('ALL');
  const [statusFilterAcc, setStatusFilterAcc] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');
  const [sortByAcc, setSortByAcc] = useState<'NEWEST' | 'OLDEST' | 'USERNAME_ASC'>('NEWEST');

  // Giá trị đang gõ/chọn trên thanh công cụ — CHƯA áp dụng vào bảng.
  // Chỉ khi bấm "Tìm kiếm" hoặc nhấn Enter (submit form) thì mới copy
  // sang các state phía trên để lọc lại danh sách.
  const [searchDraft, setSearchDraft] = useState('');
  const [roleDraft, setRoleDraft] = useState<'ALL' | 'Admin' | 'Manager' | 'Customer'>('ALL');
  const [statusDraft, setStatusDraft] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL');

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchDraft);
    setRoleFilter(roleDraft);
    setStatusFilterAcc(statusDraft);
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setSearchTerm('');
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '',
    phone: '',
    address: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    gender: 'Nam',
    dateOfBirth: '',
    phone: '',
    address: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, accountId: number | null}>({isOpen: false, accountId: null});

  // Confirm Role Change Modal state
  const [roleChangeModal, setRoleChangeModal] = useState<{
    isOpen: boolean;
    account: Account | null;
    newRole: string;
  }>({
    isOpen: false,
    account: null,
    newRole: ''
  });
  
  // Toast state
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error', id: number}[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast(prev => [...prev, {message, type, id}]);
    setTimeout(() => {
      setToast(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchAccounts = async () => {
  setLoading(true);
  setError('');
  try {
    const res = await api.get('/accounts');
    // Backend trả về { success, data: [...] } — cần unwrap giống các API khác trong dự án,
    // nếu không "accounts" sẽ là object thay vì array và toàn bộ .filter/.map phía dưới sẽ lỗi.
    const list = res.data?.data ?? res.data ?? [];
    setAccounts(Array.isArray(list) ? list : []);
  } catch (err: any) {
    setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu tài khoản');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAccounts();
  }, []);

  const ROLE_OPTIONS = ['Admin', 'Manager', 'Customer'];

const getRoleLabel = (roleName?: string) => {
  switch (roleName) {
    case 'Admin':
      return 'Quản trị viên';
    case 'Manager':
      return 'Quản lý';
    case 'Customer':
      return 'Khách hàng';
    default:
      return roleName || 'Không xác định';
  }
};

const requestChangeRole = (account: Account, newRole: string) => {
  if (newRole === account.role?.roleName) return;

  setRoleChangeModal({
    isOpen: true,
    account,
    newRole
  });
};

const executeChangeRole = async () => {
  if (!roleChangeModal.account || !roleChangeModal.newRole) return;

  const account = roleChangeModal.account;
  const newRole = roleChangeModal.newRole;

  try {
    await api.patch(`/accounts/${account.accountId}/role`, { roleName: newRole });
    showToast(`Đã đổi vai trò thành ${getRoleLabel(newRole)}`, 'success');
    setRoleChangeModal({ isOpen: false, account: null, newRole: '' });
    fetchAccounts();
  } catch (err: any) {
    showToast(err.response?.data?.message || 'Đổi vai trò thất bại', 'error');
  }
};

  const toggleLock = async (account: Account) => {
    try {
      const endpoint = `/accounts/${account.accountId}/${account.isLocked ? 'unlock' : 'lock'}`;
      await api.patch(endpoint);
      // Reload or update state
      setAccounts(accounts.map(acc => 
        acc.accountId === account.accountId ? { ...acc, isLocked: !acc.isLocked } : acc
      ));
      showToast(account.isLocked ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra', 'error');
    }
  };

  const openEdit = async (account: Account) => {
    if (account.role?.roleName !== 'Customer') {
      showToast('Chỉ hỗ trợ sửa thông tin cho tài khoản Khách hàng.', 'error');
      return;
    }
    
    setSelectedAccountId(account.accountId);
    setIsEditModalOpen(true);
    setIsModalLoading(true);
    
    try {
      const res = await api.get(`/customers/${account.accountId}/profile`);
      const data = res.data;
      setEditFormData({
        fullName: data.fullName || '',
        gender: data.gender || 'Nam',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.substring(0, 10) : '',
        phone: data.phone || '',
        address: data.address || ''
      });
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi tải thông tin chi tiết.', 'error');
      setIsEditModalOpen(false);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId) return;

    setIsSaving(true);
    try {
      await api.put(`/customers/${selectedAccountId}`, editFormData);
      showToast('Cập nhật thông tin thành công!', 'success');
      setIsEditModalOpen(false);
      fetchAccounts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi cập nhật thông tin.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await api.post('/admin/customers', addFormData);
      showToast('Thêm khách hàng thành công!', 'success');
      setIsAddModalOpen(false);
      setAddFormData({
        username: '',
        password: '',
        fullName: '',
        gender: 'Nam',
        dateOfBirth: '',
        phone: '',
        address: ''
      });
      fetchAccounts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi thêm khách hàng mới.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const requestDeleteCustomer = (account: Account) => {
    if (account.role?.roleName !== 'Customer') {
      showToast('Chỉ hỗ trợ xóa tài khoản Khách hàng.', 'error');
      return;
    }
    setConfirmModal({isOpen: true, accountId: account.accountId});
  };

  const executeDeleteCustomer = async () => {
    if (!confirmModal.accountId) return;
    
    try {
      await api.delete(`/customers/${confirmModal.accountId}`);
      showToast('Đã xóa khách hàng thành công!', 'success');
      setConfirmModal({isOpen: false, accountId: null});
      fetchAccounts(); // Làm mới lại bảng
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi xóa khách hàng.', 'error');
    }
  };

  const filteredAccounts = accounts
    .filter(acc => {
      const searchLower = searchTerm.trim().toLowerCase();
      const isUsernameMatch = acc.username.toLowerCase().includes(searchLower);
      const isExactIdMatch = searchTerm.trim() !== '' && !isNaN(Number(searchTerm)) && acc.accountId.toString() === searchTerm.trim();
      const matchSearch = searchLower === '' || isUsernameMatch || isExactIdMatch;

      const matchRole = roleFilter === 'ALL' || acc.role?.roleName === roleFilter;
      const matchStatus =
        statusFilterAcc === 'ALL' ||
        (statusFilterAcc === 'ACTIVE' && !acc.isLocked) ||
        (statusFilterAcc === 'LOCKED' && acc.isLocked);

      return matchSearch && matchRole && matchStatus;
    })
    .sort((a, b) => {
      // Luôn ưu tiên nhóm theo vai trò: Admin → Manager → Customer.
      const ROLE_PRIORITY: Record<string, number> = { Admin: 0, Manager: 1, Customer: 2 };
      const roleDiff =
        (ROLE_PRIORITY[a.role?.roleName ?? ''] ?? 99) -
        (ROLE_PRIORITY[b.role?.roleName ?? ''] ?? 99);
      if (roleDiff !== 0) return roleDiff;

      // Trong cùng một vai trò, áp dụng tiêu chí sắp xếp đang chọn.
      switch (sortByAcc) {
        case 'OLDEST':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'USERNAME_ASC':
          return a.username.localeCompare(b.username);
        case 'NEWEST':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="account-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý tài khoản</h1>
          <p className="page-subtitle">Xem và quản lý danh sách tài khoản hệ thống</p>
        </div>
        <button
          className="btn-refresh"
          onClick={fetchAccounts}
          title="Làm mới"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="error-message" style={{marginBottom: 16}}>{error}</div>}

      <div className="table-card">
        <div className="table-toolbar">
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} title="Thêm khách hàng">
            <Plus size={18} />
            Thêm mới
          </button>

          <form className="acc-toolbar" onSubmit={handleApplyFilters}>
            <label className="acc-toolbar__search">
              <Search size={16} className="acc-toolbar__search-icon" />
              <input
                type="text"
                className="acc-toolbar__search-input"
                placeholder="Tìm kiếm tên đăng nhập hoặc ID..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
              {searchDraft && (
                <button
                  type="button"
                  className="acc-toolbar__search-reset"
                  onClick={handleClearSearch}
                  title="Xóa từ khóa"
                >
                  <X size={13} />
                </button>
              )}
            </label>

            <select
              className="form-select"
              value={roleDraft}
              onChange={(e) => setRoleDraft(e.target.value as any)}
            >
              <option value="ALL">Tất cả vai trò</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{getRoleLabel(r)}</option>
              ))}
            </select>

            <select
              className="form-select"
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value as any)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
            </select>

            <select
              className="form-select"
              value={sortByAcc}
              onChange={(e) => setSortByAcc(e.target.value as any)}
            >
              <option value="NEWEST">Mới nhất</option>
              <option value="OLDEST">Cũ nhất</option>
              <option value="USERNAME_ASC">Tên đăng nhập A-Z</option>
            </select>

            <button type="submit" className="acc-toolbar__submit">
              <Search size={16} />
              Tìm kiếm
            </button>
          </form>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th className="text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(account => (
                <tr key={account.accountId}>
                  <td>#{account.accountId}</td>
                  <td className="font-medium">{account.username}</td>
                  <td>
                    <select
                      className={`role-badge role-${account.role?.roleName.toLowerCase()}`}
                      value={account.role?.roleName}
                      onChange={(e) => requestChangeRole(account, e.target.value)}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{getRoleLabel(r)}</option>
              ))}
                    </select>
                  </td>
                  <td>
                    {account.isLocked ? (
                      <span className="status-badge status-locked">Đã khóa</span>
                    ) : (
                      <span className="status-badge status-active">Hoạt động</span>
                    )}
                  </td>
                  <td className="text-muted">{new Date(account.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="text-right actions-cell">
                    <button className="action-btn-text lock-btn" title="Xóa khách hàng" onClick={() => requestDeleteCustomer(account)}>
                      Xóa
                    </button>
                    <button className="action-btn-text edit-btn" title="Chỉnh sửa" onClick={() => openEdit(account)}>
                      Sửa
                    </button>
                    <button 
                      className={`action-btn-text ${account.isLocked ? 'unlock-btn' : 'lock-btn'}`}
                      title={account.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                      onClick={() => toggleLock(account)}
                    >
                      {account.isLocked ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
                </tr>
              ))}
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Sửa Khách hàng */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Sửa thông tin Khách hàng</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {isModalLoading ? (
                  <p className="text-center text-muted">Đang tải dữ liệu...</p>
                ) : (
                  <div className="customer-details">
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Họ và tên</label>
                      <input 
                        type="text" 
                        required 
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Giới tính</label>
                      <select 
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ngày sinh</label>
                      <input 
                        type="date" 
                        required 
                        value={editFormData.dateOfBirth}
                        onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Số điện thoại</label>
                      <input 
                        type="text" 
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Địa chỉ</label>
                      <input 
                        type="text" 
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSaving || isModalLoading} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Đổi Vai trò */}
      {roleChangeModal.isOpen && roleChangeModal.account && (
        <div className="modal-overlay">
          <div className="modal-content role-confirm-modal">
            <div className="modal-header">
              <h2>Xác nhận đổi vai trò</h2>
              <button
                className="close-btn"
                onClick={() => setRoleChangeModal({ isOpen: false, account: null, newRole: '' })}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body role-confirm-body">
              <div className="role-confirm-icon">
                <AlertCircle size={24} />
              </div>

              <p className="role-confirm-message">
                Bạn có chắc chắn muốn thay đổi vai trò của tài khoản này không?
              </p>

              <div className="role-confirm-info">
                <div className="role-confirm-row">
                  <span>Tên đăng nhập</span>
                  <strong>{roleChangeModal.account.username}</strong>
                </div>
                <div className="role-confirm-row">
                  <span>Vai trò hiện tại</span>
                  <strong>{getRoleLabel(roleChangeModal.account.role?.roleName)}</strong>
                </div>
                <div className="role-confirm-row">
                  <span>Vai trò mới</span>
                  <strong className="role-confirm-new">
                    {getRoleLabel(roleChangeModal.newRole)}
                  </strong>
                </div>
              </div>

              <p className="role-confirm-warning">
                Thay đổi này sẽ có hiệu lực ngay sau khi bạn xác nhận.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setRoleChangeModal({ isOpen: false, account: null, newRole: '' })}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-role-confirm"
                onClick={executeChangeRole}
              >
                Xác nhận đổi vai trò
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="close-btn" onClick={() => setConfirmModal({isOpen: false, accountId: null})}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-main)' }}>
                Bạn có chắc chắn muốn xóa khách hàng này không? Dữ liệu sẽ được ẩn khỏi hệ thống.
              </p>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmModal({isOpen: false, accountId: null})} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                Hủy
              </button>
              <button className="btn-danger" onClick={executeDeleteCustomer}>
                <Trash2 size={16} />
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Khách hàng */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Thêm Khách hàng mới</h2>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="customer-details">
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tên đăng nhập *</label>
                    <input 
                      type="text" 
                      required 
                      value={addFormData.username}
                      onChange={(e) => setAddFormData({...addFormData, username: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Mật khẩu *</label>
                    <input 
                      type="password" 
                      required 
                      minLength={6}
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Họ và tên *</label>
                    <input 
                      type="text" 
                      required 
                      value={addFormData.fullName}
                      onChange={(e) => setAddFormData({...addFormData, fullName: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Giới tính</label>
                    <select 
                      value={addFormData.gender}
                      onChange={(e) => setAddFormData({...addFormData, gender: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ngày sinh *</label>
                    <input 
                      type="date" 
                      required 
                      value={addFormData.dateOfBirth}
                      onChange={(e) => setAddFormData({...addFormData, dateOfBirth: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Số điện thoại</label>
                    <input 
                      type="text" 
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Địa chỉ</label>
                    <input 
                      type="text" 
                      value={addFormData.address}
                      onChange={(e) => setAddFormData({...addFormData, address: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" disabled={isAdding} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  {isAdding ? 'Đang thêm...' : 'Thêm khách hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toast.map(t => (
          <div key={t.id} className={`toast-message toast-${t.type}`}>
            {t.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountManagement;
