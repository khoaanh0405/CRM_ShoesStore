import { AuthBanner } from '@/components/AuthBanner';
import { AuthButton } from '@/components/AuthButton';
import { AuthSegmentedTabs } from '@/components/AuthSegmentedTabs';
import { AuthTextField } from '@/components/AuthTextField';
import { AuthColors } from '@/constants/authTheme';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/services/api-client';
import { validatePassword, validateUsername } from '@/utils/validation';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Đăng nhập khách hàng (mục 4.3.2 Yeu_cau_do_an.docx). */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string | null; password?: string | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    setErrors({ username: usernameError, password: passwordError });
    if (usernameError || passwordError) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await login({ username: username.trim(), password });
      navigate('/tabs', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Sai tên đăng nhập hoặc mật khẩu.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" style={{ background: AuthColors.background }}>
      <AuthBanner />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
        <AuthSegmentedTabs active="login" />
        <div>
          <h1 style={{ color: AuthColors.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: '34px', whiteSpace: 'nowrap' }}>Chào mừng đến với Ouran</h1>
          <p style={{ color: AuthColors.textSecondary, fontSize: 13.5, marginTop: 6 }}>Đăng nhập để tham gia khảo sát và đánh giá sản phẩm.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AuthTextField label="Tên đăng nhập" autoCapitalize="none" autoCorrect="off" value={username} onChangeText={setUsername} error={errors.username} />
          <AuthTextField
            label="Mật khẩu" type="password" secureToggle value={password} onChangeText={setPassword} error={errors.password}
            rightAction={{ label: 'Quên mật khẩu?', onClick: () => navigate('/auth/forgot-password') }}
          />
        </div>

        {formError ? <div style={{ color: AuthColors.danger, fontSize: 13 }}>{formError}</div> : null}

        <AuthButton label="Đăng nhập" type="submit" onClick={() => {}} loading={submitting} />
      </div>
    </form>
  );
}
