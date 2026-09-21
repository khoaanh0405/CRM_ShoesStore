import React, { useState, useEffect } from 'react';
import { changePassword } from '../services/api';
import toast from 'react-hot-toast';
import { User, Lock, Key } from 'lucide-react';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!passwords.oldPassword || !passwords.newPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    if (!user?.accountId) {
      toast.error('Không tìm thấy thông tin tài khoản');
      return;
    }

    setLoading(true);
    try {
      await changePassword(user.accountId, {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Đổi mật khẩu thành công');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: '2rem' }}>Đang tải...</div>;

  return (
    <div className="profile-page">
      <h1 className="page-title">Hồ sơ Quản trị viên</h1>
      
      <div className="profile-container">
        <div className="profile-info-card">
          <h2><User size={20} className="icon-mr" /> Thông tin tài khoản</h2>
          <div className="info-group">
            <label>Tên đăng nhập</label>
            <p>{user.username}</p>
          </div>
          <div className="info-group">
            <label>Vai trò (Role)</label>
            <p className="role-badge">{user.role?.roleName || 'Admin'}</p>
          </div>
          <div className="info-group">
            <label>Trạng thái</label>
            <p className={user.isLocked ? "status-locked" : "status-active"}>
              {user.isLocked ? "Bị khóa" : "Đang hoạt động"}
            </p>
          </div>
        </div>

        <div className="profile-password-card">
          <h2><Lock size={20} className="icon-mr" /> Đổi mật khẩu</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <div className="input-with-icon">
                <Key size={16} />
                <input 
                  type="password" 
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input 
                  type="password" 
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input 
                  type="password" 
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
