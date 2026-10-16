import React, { useState, useEffect, useCallback } from 'react';
import api, { changePassword } from '../../services/api';
import toast from 'react-hot-toast';
import { User, Lock, Key, Pencil } from 'lucide-react';
import { normalizeEmail, validateEmail } from '../../utils/validation';
import './ProfilePage.css';

interface EmployeeProfile {
  employeeId: number;
  username: string;
  roleName?: string;
  isLocked?: boolean;
  fullName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  position?: string | null;
  hireDate?: string | null;
}

interface ProfileForm {
  fullName: string; dateOfBirth: string; gender: string; phone: string; email: string; address: string;
}

const GENDERS = ['Nam', 'Nữ', 'Khác'];
const errMsg = (e: any, fallback: string) => e?.response?.data?.message ?? fallback;
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');
const toInputDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');
const toForm = (p: EmployeeProfile): ProfileForm => ({
  fullName: p.fullName ?? '',
  dateOfBirth: toInputDate(p.dateOfBirth),
  gender: p.gender ?? '',
  phone: p.phone ?? '',
  email: p.email ?? '',
  address: p.address ?? '',
});

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'edit' | 'password'>('profile');
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({ fullName: '', dateOfBirth: '', gender: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get('/employees/me');
      const data: EmployeeProfile = res.data?.data ?? res.data;
      setProfile(data);
      setForm(toForm(data));
      setLoadError(null);
    } catch (e) {
      setLoadError(errMsg(e, 'Không tải được hồ sơ nhân sự'));
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleTabChange = (tab: 'profile' | 'edit' | 'password') => {
    if (tab === 'edit' && profile) {
      setForm(toForm(profile));
    }
    setActiveTab(tab);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const fullName = form.fullName.trim().replace(/\s+/g, ' ');
    if (fullName.length < 2) return void toast.error('Họ tên tối thiểu 2 ký tự.');
    if (form.dateOfBirth && new Date(form.dateOfBirth).getTime() > Date.now()) return void toast.error('Ngày sinh không được ở tương lai.');
    const phone = form.phone.replace(/[\s.\-]/g, '');
    if (phone && !/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)) return void toast.error('Số điện thoại không hợp lệ (vd: 0912345678).');

    const emailChanged = normalizeEmail(form.email) !== (profile.email ?? '');
    if (emailChanged) {
      const emailErr = validateEmail(form.email);
      if (emailErr) return void toast.error(emailErr);
    }

    setSaving(true);
    try {
      const res = await api.put('/employees/me', {
        fullName,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        phone: phone || undefined,
        address: form.address.trim() || undefined,
        ...(emailChanged ? { email: normalizeEmail(form.email) } : {}),
      });
      const data: EmployeeProfile = res.data?.data ?? res.data;
      setProfile(data);
      setForm(toForm(data));
      setActiveTab('profile');
      toast.success('Đã cập nhật thông tin cá nhân');
    } catch (err) {
      toast.error(errMsg(err, 'Cập nhật thông tin thất bại'));
    } finally {
      setSaving(false);
    }
  };

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

    if (!profile?.employeeId) {
      toast.error('Không tìm thấy thông tin tài khoản');
      return;
    }

    setLoading(true);
    try {
      await changePassword(profile.employeeId, {
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

  if (loadError) return <div style={{ padding: '2rem' }}>{loadError}</div>;
  if (!profile) return <div style={{ padding: '2rem' }}>Đang tải...</div>;

  const set = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="profile-page">
      <div className="profile-layout-container">
        {/* Sidebar trái */}
        <div className="profile-sidebar">
          <div className="profile-sidebar-header">
            <div className="profile-avatar-circle">
              <User size={40} />
            </div>
            <h3>{profile.fullName}</h3>
          </div>
          <nav className="profile-nav">
            <button
              className={`profile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              <User size={20} /> Thông tin cá nhân
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => handleTabChange('edit')}
            >
              <Pencil size={20} /> Chỉnh sửa thông tin
            </button>
            <button
              className={`profile-nav-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => handleTabChange('password')}
            >
              <Lock size={20} /> Đổi mật khẩu
            </button>
          </nav>
        </div>

        {/* Khung nội dung chính bên phải */}
        <div className="profile-content-area">
          {activeTab === 'profile' && (
            <div className="profile-card">
              <div className="card-header-flex">
                <div>
                  <h2>Thông tin cá nhân</h2>
                  <p className="card-subtitle">Thông tin cá nhân bạn đã đăng ký với hệ thống.</p>
                </div>
              </div>

              <div className="info-rows-container">
                <div className="info-row">
                  <div className="info-cell">
                    <label>Họ và tên</label>
                    <p>{profile.fullName}</p>
                  </div>
                  <div className="info-cell">
                    <label>Ngày sinh</label>
                    <p>{fmtDate(profile.dateOfBirth)}</p>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-cell">
                    <label>Tên đăng nhập</label>
                    <p>{profile.username}</p>
                  </div>
                  <div className="info-cell">
                    <label>Số điện thoại</label>
                    <p>{profile.phone || '—'}</p>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-cell">
                    <label>Vai trò (Role)</label>
                    <p><span className="role-badge">{profile.roleName || 'Admin'}</span></p>
                  </div>
                  <div className="info-cell">
                    <label>Chức vụ</label>
                    <p>{profile.position || '—'}</p>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-cell">
                    <label>Email</label>
                    <p>{profile.email || '—'}</p>
                  </div>
                  <div className="info-cell">
                    <label>Địa chỉ</label>
                    <p>{profile.address || '—'}</p>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-cell">
                    <label>Giới tính</label>
                    <p>{profile.gender || '—'}</p>
                  </div>
                  <div className="info-cell">
                    <label>Ngày vào làm</label>
                    <p>{fmtDate(profile.hireDate)}</p>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-cell full-width">
                    <label>Trạng thái</label>
                    <p className={profile.isLocked ? 'status-locked' : 'status-active'}>
                      {profile.isLocked ? 'Bị khóa' : 'Đang hoạt động'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="profile-card">
              <div className="card-header-flex">
                <div>
                  <h2>Chỉnh sửa thông tin cá nhân</h2>
                  <p className="card-subtitle">Cập nhật thông tin chi tiết tài khoản của bạn.</p>
                </div>
              </div>
              <form onSubmit={handleSaveProfile} className="profile-edit-form-clean">
                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Họ tên *</label>
                    <input className="profile-input" value={form.fullName} maxLength={100} onChange={set('fullName')} />
                  </div>
                  <div className="form-group">
                    <label>Ngày sinh</label>
                    <input className="profile-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                  </div>
                </div>
                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Email</label>
                    <input className="profile-input" type="email" value={form.email} maxLength={100} onChange={set('email')} />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input className="profile-input" value={form.phone} maxLength={20} inputMode="tel" onChange={set('phone')} />
                  </div>
                </div>
                <div className="form-row-grid">
                  <div className="form-group">
                    <label>Giới tính</label>
                    <select className="profile-input" value={form.gender} onChange={set('gender')}>
                      <option value="">— Chưa chọn —</option>
                      {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Địa chỉ</label>
                    <input className="profile-input" value={form.address} maxLength={255} onChange={set('address')} />
                  </div>
                </div>
                <div className="profile-edit-actions">
                  <button type="button" className="profile-cancel-btn" onClick={() => handleTabChange('profile')} disabled={saving}>Hủy</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="profile-card">
              <div className="card-header-flex">
                <div>
                  <h2>Đổi mật khẩu</h2>
                  <p className="card-subtitle">Đảm bảo tài khoản của bạn sử dụng mật khẩu mạnh.</p>
                </div>
              </div>
              <form onSubmit={handlePasswordChange} className="password-form-clean">
                <div className="password-form-body">
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
                </div>
                <div className="profile-edit-actions">
                  <button type="button" className="profile-cancel-btn" onClick={() => handleTabChange('profile')} disabled={loading}>Hủy</button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;