import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../../services/auth';
import { LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Sai tên đăng nhập hoặc mật khẩu';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <ShieldCheck size={34} strokeWidth={2.2} />
          </div>
          <h1>Ouran</h1>
          <p>Đăng nhập để quản trị hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Tên đăng nhập</label>
            <input
              id="login-username"
              type="text"
              className="form-input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              <LogIn size={18} />
            )}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
