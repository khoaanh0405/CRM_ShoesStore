import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, X, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import api from '../utils/api';
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
      const [accountsRes, customersRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/customers') // Chỉ trả về các khách hàng chưa bị xóa (isDeleted: false)
      ]);
      
      const allAccounts = accountsRes.data;
      const activeCustomers = customersRes.data;
      const activeCustomerIds = new Set(activeCustomers.map((c: any) => c.customerId));

      // Lọc: Giữ lại Admin/Staff, và chỉ giữ lại Customer nếu nằm trong activeCustomerIds
      const activeAccounts = allAccounts.filter((acc: Account) => {
        if (acc.role?.roleName === 'Customer') {
          return activeCustomerIds.has(acc.accountId);
        }
        return true;
      });

      setAccounts(activeAccounts);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

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

  const filteredAccounts = accounts.filter(acc => {
    const searchLower = searchTerm.trim().toLowerCase();
    const isUsernameMatch = acc.username.toLowerCase().includes(searchLower);
    const isExactIdMatch = searchTerm.trim() !== '' && !isNaN(Number(searchTerm)) && acc.accountId.toString() === searchTerm.trim();
    
    return isUsernameMatch || isExactIdMatch;
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
        <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-primary" onClick={() => setIsAddModalOpen(true)} title="Thêm khách hàng">
            <Plus size={18} />
            Thêm mới
          </button>
          
          <div className="search-box enhanced">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Tìm kiếm username hoặc ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
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
                    <span className={`role-badge role-${account.role?.roleName.toLowerCase()}`}>
                      {account.role?.roleName}
                    </span>
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
